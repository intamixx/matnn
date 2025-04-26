from tinydb import TinyDB, Query
import json
import sys
import os

# Initialize the database
db_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'db.json')
os.makedirs(os.path.dirname(db_path), exist_ok=True)
db = TinyDB(db_path)

# Create tables for different collections
users_table = db.table('users')
form_submissions_table = db.table('form_submissions')

def handle_command():
    """Process commands from stdin and return results to stdout"""
    command_data = json.loads(sys.stdin.read())
    command = command_data.get('command')
    params = command_data.get('params', {})
    
    result = {'success': False, 'data': None, 'error': None}
    
    try:
        if command == 'get_user':
            user_id = params.get('id')
            User = Query()
            user = users_table.get(User.id == user_id)
            result['data'] = user
            result['success'] = True
        
        elif command == 'get_user_by_username':
            username = params.get('username')
            User = Query()
            user = users_table.get(User.username == username)
            result['data'] = user
            result['success'] = True
        
        elif command == 'create_user':
            user_data = params.get('user')
            # Get the highest ID or start with 1
            users = users_table.all()
            next_id = 1
            if users:
                next_id = max(user.get('id', 0) for user in users) + 1
            
            user_data['id'] = next_id
            users_table.insert(user_data)
            result['data'] = user_data
            result['success'] = True
        
        elif command == 'create_form_submission':
            submission_data = params.get('submission')
            # Get the highest ID or start with 1
            submissions = form_submissions_table.all()
            next_id = 1
            if submissions:
                next_id = max(sub.get('id', 0) for sub in submissions) + 1
            
            submission_data['id'] = next_id
            form_submissions_table.insert(submission_data)
            result['data'] = submission_data
            result['success'] = True
        
        elif command == 'get_all_form_submissions':
            submissions = form_submissions_table.all()
            result['data'] = submissions
            result['success'] = True
        
        else:
            result['error'] = f'Unknown command: {command}'
    
    except Exception as e:
        result['error'] = str(e)
    
    # Return the result
    print(json.dumps(result))

if __name__ == '__main__':
    handle_command()