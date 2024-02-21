!/usr/bin/python3

# Webhook Argument list
# 1) Destination URL
# 2) Job ID
# 3) Result

import requests
import hashlib
import hmac
import json
import base64
import sys

if (len(sys.argv) != 4):
    print ("invalid number of arguments")
    sys.exit(1)
url = sys.argv[1]
job_id = sys.argv[2]
try:
    result = int(sys.argv[3])
except:
    print ("argument 3 not an integer")
    sys.exit(1)

def webhook():
    print (result)
    if result == 0:
        status = "finished"
    else:
        status = "error"
    body = { "id": job_id, "event": { "status": status } }
    key = 'webhookSecret'
    #byteKey = bytes(key, 'UTF-8')
    try:
        payload = json.dumps(body)
    except TypeError:
        print ("Not valid json")
        sys.exit(1)
    #print (type(body))
    #print (jsonStr)
    #message = jsonStr.encode()
    #print ("message")
    #print (message)
    digest = hmac.new(bytes(key, 'UTF-8'), bytes(payload, 'UTF-8'), hashlib.sha256)
    #print (base64.b64encode(bytes(key, 'UTF-8')))
    #hashed = hmac.new(byteKey, message, digestmod=hashlib.sha256).digest()
    signature = digest.hexdigest()
    print (signature)
    try:
        response = requests.post(url, data=payload, headers={'X-Matnn-Signature': signature, 'Content-Type': 'application/json'}, timeout=2)
    except requests.Timeout:
        print ("Timeout")
        pass
        sys.exit(1)
    except requests.ConnectionError:
        print ("Connection Error")
        pass
        sys.exit(1)
    except:
        print ("General Error")
        pass
        sys.exit(1)
    print (response)
    return (body, signature)
    #return (message, hashed)

def verify_webhook(data, hmac_header):
    API_SECRET_KEY = 'webhookSecret'
    #body = json.dumps(data)
    # Calculate HMAC
    print ("in VERIFY! \n\n")
    print (data)
    print (hmac_header)
    signature = hmac.new(API_SECRET_KEY.encode('utf-8'), bytes(body, 'UTF-8'), digestmod=hashlib.sha256).hexdigest()
    print ("VERIFY HELLLLO")
    print (signature)
    #computed_hmac = base64.b64encode(digest)
    #print (computed_hmac)

    #return hmac.compare_digest(computed_hmac, hmac_header.encode('utf-8'))
    return hmac.compare_digest(signature, hmac_header)

#@app.route('/webhook', methods=['POST'])
#def handle_webhook():
                # Get raw body
#    data = request.get_data()

    # Compare HMACs
#    verified = verify_webhook(data, request.headers.get('X-Signature-SHA256'))

#    if not verified:
#        abort(401)

    # Do something with the webhook

#    return ('', 200)


print ("LETS START")
(body, signature) = webhook()
print ("BACK FROM FUNCTION")
print (body)
#print (signature)
#print (type(signature))
sys.exit(0)

#verified = verify_webhook(data, request.headers.get('X-Signature-SHA256'))

#verified = verify_webhook(body, signature)
#print (verified)
