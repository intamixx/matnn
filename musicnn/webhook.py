#!/usr/bin/python3

import requests
import hashlib
import hmac
import json
import base64
import sys

def jsonWebhookSecretExample():
    url = 'https://example.domo.com/api/iot/v1/webhook/data/aseKEdjweksKSSPwasjdflKEecklsClsjeQ'
    #url = 'https://tuti.com/bud'
    json_dict = {"data": [{"name": "Ashley", "age": 22}, {"name": "Ben", "age": 24}, {"name": "Melissa", "age": 31}, {"name": "Eddy", "age": 29}]}
    key = 'webhookSecret'
    #byteKey = bytes(key, 'UTF-8')
    body = json.dumps(json_dict)
    print (type(body))
    #print ("json dumps")
    #print (jsonStr)
    #message = jsonStr.encode()
    #print ("message")
    #print (message)
    digest = hmac.new(bytes(key, 'UTF-8'), bytes(body, 'UTF-8'), hashlib.sha256)
    print (base64.b64encode(bytes(key, 'UTF-8')))
    #hashed = hmac.new(byteKey, message, digestmod=hashlib.sha256).digest()
    signature = digest.hexdigest()
    print ("HELLLLO")
    print (signature)
    #try:
    #    response = requests.post(url, headers={'X-Hub-Signature': hashed.hexdigest(), 'Content-Type': 'application/json'}, timeout=2)
    #except requests.Timeout:
    #    print ("Timeout")
    #    pass
    #except requests.ConnectionError:
    #    print ("Connection Error")
    #    pass
    #except:
    #    print ("General Error")
    #    pass
    #print (response)
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
    #digest = hmac.new(bytes(API_SECRET_KEY, 'utf-8'), bytes(body, 'UTF-8'), digestmod=hashlib.sha256).hexdigest()
    #digest = hmac.new(bytes(API_SECRET_KEY, 'utf-8'), bytes(body, 'UTF-8'), digestmod=hashlib.sha256)
    #digest = hmac.new(bytes(API_SECRET_KEY, 'UTF-8'), bytes(data, 'UTF-8'), hashlib.sha256)
    #print (digest)
    #signature = digest.hexdigest()
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
(body, signature) = jsonWebhookSecretExample()
print ("BACK FROM FUNCTION")
print (body)
print (signature)
print (type(signature))
#sys.exit(0)
#verified = verify_webhook(data, request.headers.get('X-Signature-SHA256'))
verified = verify_webhook(body, signature)
print (verified)
#if not verified:
#    print ("
