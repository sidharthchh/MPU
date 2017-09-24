import json

from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt

from .s3_helper import s3


def home(request):
    return render(request, 'home.html')


@csrf_exempt
def initiate_upload(request):
    file_name = request.POST.get('file_name')
    upload_id = s3.initiate_multipart_upload(file_name)
    data = {"upload_id": upload_id}
    return HttpResponse(json.dumps(data), status=200, content_type='application/json')


@csrf_exempt
def get_presigned_url_for_part(request):
    file_name = request.POST.get('file_name')
    upload_id = request.POST.get('upload_id')
    part_number = request.POST.get('part_number')
    url = s3.get_presigned_post_url(file_name, part_number, upload_id)
    data = {'signed_url': url}
    return HttpResponse(json.dumps(data), status=200, content_type='application/json')


@csrf_exempt
def complete_multipart_upload(request):
    file_name = request.POST.get('file_name')
    upload_id = request.POST.get('upload_id')
    parts = request.POST.get('parts')
    print(parts)
    parts = json.loads(parts)
    print(parts)
    data = s3.complete_multipart_upload(file_name, upload_id, parts)
    return HttpResponse(json.dumps(data), status=200, content_type='application/json')
