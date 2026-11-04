import json
import os
from http.server import BaseHTTPRequestHandler

import psycopg


def send_json(request, status, data):
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    request.send_response(status)
    request.send_header("Content-Type", "application/json; charset=utf-8")
    request.send_header("Content-Length", str(len(body)))
    request.send_header("Cache-Control", "no-store")
    request.end_headers()
    request.wfile.write(body)


def normalize_answers(raw_answers):
    if not isinstance(raw_answers, dict):
        return None
    normalized = {}
    for index in range(21):
        try:
            value = int(raw_answers.get(str(index)))
        except (TypeError, ValueError):
            return None
        if not 1 <= value <= 6:
            return None
        normalized[str(index)] = value
    return normalized


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            database_url = os.environ.get("DATABASE_URL", "").strip()
            if not database_url:
                raise RuntimeError("服务端未配置数据库连接")
            with psycopg.connect(database_url, prepare_threshold=None) as connection:
                rows = connection.execute(
                    "SELECT answers_json FROM questionnaire_submissions ORDER BY id"
                ).fetchall()
            counts = [[0 for _ in range(6)] for _ in range(21)]
            completed_count = 0
            for row in rows:
                answers = row[0]
                if isinstance(answers, str):
                    try:
                        answers = json.loads(answers)
                    except json.JSONDecodeError:
                        continue
                answers = normalize_answers(answers)
                if answers is None:
                    continue
                completed_count += 1
                for question_index in range(21):
                    counts[question_index][answers[str(question_index)] - 1] += 1
            questions = []
            for question_index, option_counts in enumerate(counts):
                questions.append({
                    "questionNumber": question_index + 1,
                    "responses": completed_count,
                    "options": [
                        {
                            "value": option_index + 1,
                            "count": count,
                            "percentage": round(count / completed_count * 100, 1) if completed_count else 0,
                        }
                        for option_index, count in enumerate(option_counts)
                    ],
                })
            send_json(self, 200, {"completedCount": completed_count, "questions": questions})
        except Exception as error:
            print(f"questionnaire statistics failed: {error}")
            send_json(self, 500, {"error": "问卷统计暂时不可用"})

    def do_POST(self):
        send_json(self, 405, {"error": "请求方法不支持"})
