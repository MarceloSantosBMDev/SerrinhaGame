"""Servidor local para desenvolvimento — desliga o cache do navegador.
Uso:  python dev-server.py   (abre em http://localhost:5577)
"""
import http.server, socketserver

PORT = 5577

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, *args):
        pass

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), NoCache) as httpd:
        print(f"Arena Fighter em http://localhost:{PORT}")
        httpd.serve_forever()
