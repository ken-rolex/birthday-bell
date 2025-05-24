#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 12000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('X-Frame-Options', 'ALLOWALL')
        super().end_headers()

if __name__ == "__main__":
    os.chdir('/workspace')
    with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Server running at http://0.0.0.0:{PORT}/")
        print(f"Access the Birthday Bell app at: https://work-1-bakqybwnnrbxoqne.prod-runtime.all-hands.dev")
        httpd.serve_forever()