import json
import os
from http.server import BaseHTTPRequestHandler

import psycopg
from psycopg.types.json import Jsonb


def send_json(request, status, data):
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    request.send_response(status)
    request.send_header("Content-Type", "application/json; charset=utf-8")
    request.send_header("Content-Length", str(len(body)))
    request.send_header("Cache-Control", "no-store")
    request.end_headers()
    request.wfile.write(body)


def required_text(value, field, max_length):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field}不能为空")
    return value.strip()[:max_length]


def normalize_answers(raw_answers):
    if not isinstance(raw_answers, dict):
        raise ValueError("问卷答案格式无效")
    normalized = {}
    for index in range(21):
        raw_value = raw_answers.get(str(index))
        try:
            value = int(raw_value)
        except (TypeError, ValueError) as error:
            raise ValueError("请完成全部21道题后再保存") from error
        if not 1 <= value <= 6:
            raise ValueError("问卷答案取值无效")
        normalized[str(index)] = value
    return normalized


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > 100_000:
                raise ValueError("请求内容大小无效")
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            profile = payload.get("profile")
            if not isinstance(profile, dict):
                raise ValueError("问卷基本信息格式无效")
            parent_name = required_text(profile.get("parentName"), "称呼", 80)
            school = required_text(profile.get("school"), "孩子所在学校", 160)
            grade = required_text(profile.get("grade"), "年级", 40)
            gender = required_text(profile.get("gender"), "孩子性别", 20)
            if gender not in ("男", "女"):
                raise ValueError("孩子性别选项无效")
            answers = normalize_answers(payload.get("answers"))
            database_url = os.environ.get("DATABASE_URL", "").strip()
            if not database_url:
                raise RuntimeError("服务端未配置数据库连接")
            with psycopg.connect(database_url, prepare_threshold=None) as connection:
                row = connection.execute(
                    """INSERT INTO questionnaire_submissions
                       (parent_name, contact, school, grade, gender, answers_json)
                       VALUES (%s, %s, %s, %s, %s, %s)
                       RETURNING id""",
                    (parent_name, "", school, grade, gender, Jsonb(answers)),
                ).fetchone()
            send_json(self, 200, {"saved": True, "submissionId": row[0]})
        except (ValueError, json.JSONDecodeError) as error:
            send_json(self, 400, {"error": str(error)})
        except Exception as error:
            print(f"questionnaire submission failed: {error}")
            send_json(self, 500, {"error": "问卷结果保存失败"})

    def do_GET(self):
        send_json(self, 405, {"error": "请求方法不支持"})
