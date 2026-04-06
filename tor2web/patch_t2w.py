from pathlib import Path


path = Path("/opt/tor2web/tor2web/t2w.py")
text = path.read_text()

old = """    def handleError(self, failure):\n        if type(failure.value) is SOCKSError:\n            self.setResponseCode(502)\n            self.var['errorcode'] = failure.value.code\n            return flattenString(self, templates['error_sock.tpl']).addCallback(self.writeContent)\n        else:\n            return self.sendError()\n"""
new = """    def handleError(self, failure):\n        try:\n            print('Tor2web request failure:', repr(failure))\n            print(failure.getTraceback())\n        except Exception:\n            pass\n\n        if type(failure.value) is SOCKSError:\n            self.setResponseCode(502)\n            self.var['errorcode'] = failure.value.code\n            return flattenString(self, templates['error_sock.tpl']).addCallback(self.writeContent)\n        else:\n            return self.sendError()\n"""
if old not in text:
    raise SystemExit("handleError snippet not found")
text = text.replace(old, new, 1)

old = """        self.obj.uri = req.uri.decode('utf-8')\n        self.obj.host_tor = \"http://\" + self.obj.onion\n        self.obj.address = self.obj.host_tor + self.obj.uri\n"""
new = """        self.obj.uri = req.uri.decode('utf-8')\n        onion_scheme = 'http'\n        try:\n            header = req.headers.getRawHeaders(b'x-onion-scheme')\n            if header and header[0].decode('utf-8').lower() == 'https':\n                onion_scheme = 'https'\n        except Exception:\n            pass\n        self.obj.host_tor = onion_scheme + \"://\" + self.obj.onion\n        self.obj.address = self.obj.host_tor + self.obj.uri\n"""
if old not in text:
    raise SystemExit("process_request snippet not found")
text = text.replace(old, new, 1)

path.write_text(text)
