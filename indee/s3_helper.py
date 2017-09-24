import boto3
from django.conf import settings


class S3Helper(object):
    """
        A helper class to S3 that would help
        to get the presigned url and presigned post
    """

    def __init__(self):
        self.s3 = None
        self.upload_id = ''
        self.connect()

    def connect(self):
        """
        This method just connects to s3 resource in aws services
        """
        self.s3 = boto3.client('s3')

    def get_presigned_post_url(self, file_name, part_number, upload_id):
        """
        This method is used to get a presigned post
        object to post a file to the bucket
        Args:
            bucket: Name of the bucket to which file has to be uploaded

        Returns: A presigned url that is valid for 3600 seconds

        """
        url = self.s3.generate_presigned_url(
            ClientMethod='put_object',
            Params={
                'Bucket': settings.S3_DEFAULT_BUCKET,
                'Key': file_name,
                'ContentType': "multipart/form-data",
                'Body': bytes('{"partNumber":' + str(part_number) + ',"uploadId":"' + upload_id + '" }', 'utf-8')
            }
        )
        return url  # + "&uploadId=" + upload_id + "&partNumber=" + part_number

    def initiate_multipart_upload(self, file_name):
        multipart_upload = self.s3.create_multipart_upload(Bucket=settings.S3_DEFAULT_BUCKET, Key=file_name)
        return multipart_upload.get('UploadId')

    def complete_multipart_upload(self, file_name, upload_id, parts):
        return self.s3.complete_multipart_upload(
            Bucket=settings.S3_DEFAULT_BUCKET,
            Key=file_name,
            UploadId=upload_id,
            MultipartUpload={
                'Parts': parts
            })


s3 = S3Helper()
