import json
import os
import psycopg2
from datetime import datetime

def parse_token(token: str) -> int:
    """Извлечение user_id из токена"""
    try:
        user_id = int(token.split(':')[0])
        return user_id
    except:
        return None

def get_db_connection():
    """Подключение к базе данных"""
    dsn = os.environ['DATABASE_URL']
    return psycopg2.connect(dsn)

def handler(event: dict, context) -> dict:
    """API для работы с сообщениями, чатами и контактами"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': ''
        }
    
    try:
        headers = event.get('headers', {})
        auth_header = headers.get('authorization', '') or headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '').strip() if auth_header else ''
        user_id = parse_token(token)
        
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unauthorized', 'debug': f'Token: {token[:20] if token else "empty"}'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', '')
            
            if action == 'chats':
                cur.execute("""
                    SELECT DISTINCT c.id, 
                           u.id, u.username, u.display_name, u.avatar_url, 
                           (SELECT last_seen > NOW() - INTERVAL '5 minutes' FROM users WHERE id = u.id) as online,
                           m.text as last_message,
                           TO_CHAR(m.created_at, 'HH24:MI') as last_time,
                           (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND sender_id != %s 
                            AND created_at > COALESCE((SELECT last_seen FROM users WHERE id = %s), '1970-01-01')) as unread
                    FROM chats c
                    JOIN chat_members cm ON c.id = cm.chat_id
                    JOIN chat_members cm2 ON c.id = cm2.chat_id AND cm2.user_id != cm.user_id
                    JOIN users u ON cm2.user_id = u.id
                    LEFT JOIN LATERAL (
                        SELECT text, created_at 
                        FROM messages 
                        WHERE chat_id = c.id 
                        ORDER BY created_at DESC 
                        LIMIT 1
                    ) m ON true
                    WHERE cm.user_id = %s
                    ORDER BY m.created_at DESC NULLS LAST
                """, (user_id, user_id, user_id))
                
                chats = []
                for row in cur.fetchall():
                    chats.append({
                        'id': row[0],
                        'user': {
                            'id': row[1],
                            'username': row[2],
                            'name': row[3],
                            'avatar': row[4] or '',
                            'online': row[5] or False
                        },
                        'lastMessage': row[6] or '',
                        'time': row[7] or '',
                        'unread': row[8] or 0
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'chats': chats})
                }
            
            elif action == 'contacts':
                cur.execute("""
                    SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
                           (SELECT last_seen > NOW() - INTERVAL '5 minutes' FROM users WHERE id = u.id) as online
                    FROM contacts c
                    JOIN users u ON c.contact_user_id = u.id
                    WHERE c.user_id = %s
                    ORDER BY u.display_name
                """, (user_id,))
                
                contacts = []
                for row in cur.fetchall():
                    contacts.append({
                        'id': row[0],
                        'username': row[1],
                        'name': row[2],
                        'avatar': row[3] or '',
                        'bio': row[4] or '',
                        'online': row[5] or False
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'contacts': contacts})
                }
            
            elif action == 'messages':
                chat_id = event.get('queryStringParameters', {}).get('chat_id')
                
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id required'})
                    }
                
                cur.execute("""
                    SELECT m.id, m.text, m.sender_id, TO_CHAR(m.created_at, 'HH24:MI') as time
                    FROM messages m
                    WHERE m.chat_id = %s
                    ORDER BY m.created_at ASC
                """, (chat_id,))
                
                messages = []
                for row in cur.fetchall():
                    messages.append({
                        'id': row[0],
                        'text': row[1],
                        'sender': 'me' if row[2] == user_id else 'other',
                        'time': row[3]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'messages': messages})
                }
            
            elif action == 'search':
                query = event.get('queryStringParameters', {}).get('query', '').strip().lower()
                
                if not query:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'users': []})
                    }
                
                cur.execute("""
                    SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
                           EXISTS(SELECT 1 FROM contacts WHERE user_id = %s AND contact_user_id = u.id) as is_contact
                    FROM users u
                    WHERE u.id != %s AND (u.username LIKE %s OR u.display_name LIKE %s)
                    LIMIT 20
                """, (user_id, user_id, f'%{query}%', f'%{query}%'))
                
                users = []
                for row in cur.fetchall():
                    users.append({
                        'id': row[0],
                        'username': row[1],
                        'name': row[2],
                        'avatar': row[3] or '',
                        'bio': row[4] or '',
                        'isContact': row[5]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': users})
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unknown action'})
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'send':
                chat_id = body.get('chat_id')
                text = body.get('text', '').strip()
                
                if not chat_id or not text:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'chat_id and text required'})
                    }
                
                cur.execute("""
                    INSERT INTO messages (chat_id, sender_id, text)
                    VALUES (%s, %s, %s)
                    RETURNING id, TO_CHAR(created_at, 'HH24:MI')
                """, (chat_id, user_id, text))
                
                msg_id, time = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': {
                            'id': msg_id,
                            'text': text,
                            'sender': 'me',
                            'time': time
                        }
                    })
                }
            
            elif action == 'add_contact':
                username = body.get('username', '').strip().lower()
                
                if not username:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'username required'})
                    }
                
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                contact_user = cur.fetchone()
                
                if not contact_user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'})
                    }
                
                contact_id = contact_user[0]
                
                if contact_id == user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Нельзя добавить себя в контакты'})
                    }
                
                cur.execute("""
                    INSERT INTO contacts (user_id, contact_user_id)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                """, (user_id, contact_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'create_chat':
                contact_id = body.get('contact_id')
                
                if not contact_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'contact_id required'})
                    }
                
                cur.execute("""
                    SELECT c.id FROM chats c
                    JOIN chat_members cm1 ON c.id = cm1.chat_id AND cm1.user_id = %s
                    JOIN chat_members cm2 ON c.id = cm2.chat_id AND cm2.user_id = %s
                    LIMIT 1
                """, (user_id, contact_id))
                
                existing_chat = cur.fetchone()
                
                if existing_chat:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'chat_id': existing_chat[0]})
                    }
                
                cur.execute("INSERT INTO chats DEFAULT VALUES RETURNING id")
                chat_id = cur.fetchone()[0]
                
                cur.execute("""
                    INSERT INTO chat_members (chat_id, user_id) VALUES (%s, %s), (%s, %s)
                """, (chat_id, user_id, chat_id, contact_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'chat_id': chat_id})
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unknown action'})
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'})
        }
    
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()