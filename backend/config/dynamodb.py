"""DynamoDB resource and client factories."""

import boto3


def dynamodb_resource():
    return boto3.resource("dynamodb")


def dynamodb_client():
    return boto3.client("dynamodb")

