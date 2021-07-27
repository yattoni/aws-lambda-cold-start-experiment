from __future__ import print_function

import boto3
import os

def handler(event, context):
    for message in event['Records']:
        print("The message {0} for event source {1} = {2}".format(message['messageId'], message['eventSource'], str(message['body'])))
    
    sns = boto3.client('sns')

    message = "Hello from python lambda!!"
    topicArn = os.environ["TARGET_TOPIC"]

    print("Sending message to {0}".format(topicArn))

    output = sns.publish(
        TopicArn = topicArn,
        Message = message
    )

    print("Sent message with ID {0}".format(output['MessageId']))    
