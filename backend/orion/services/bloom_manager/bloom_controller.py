import os, json, math, threading, hashlib, mmap, tempfile, fcntl

class bloom_controller:
    __instance=None
    __lock=threading.RLock()

    def __new__(cls,*a,**kw):
        with cls.__lock:
            if cls.__instance is None:
                cls.__instance=super().__new__(cls)
            return cls.__instance

    def __init__(self, capacity=100_000_000_000, error_rate=0.05, growth=2.0, tighten=0.5, max_fill=0.5, block_bytes=64,
                 stripes=256, dirpath=None, hot_ratio=0.01):
        if getattr(self, "_initialized", False): return
        if dirpath is None:
            dirpath = os.path.abspath(os.path.join(os.getcwd(), "bloom_data"))
        os.makedirs(dirpath, exist_ok=True)
        if capacity <= 0 or not (0 < error_rate < 1) or growth <= 1.0 or not (0 < tighten < 1) or not (
                0 < max_fill < 1) or block_bytes <= 0 or stripes <= 0:
            raise ValueError("invalid params")
        self.capacity0 = int(capacity)
        self.total_p = float(error_rate)
        self.growth = float(growth)
        self.tighten = float(tighten)
        self.max_fill = float(max_fill)
        self.block_bits = block_bytes * 8
        self.stripes = int(stripes)
        self.dirpath = dirpath
        self.hot_ratio = float(hot_ratio)
        self.manifest_path = os.path.join(self.dirpath, "manifest.json")
        self.layers = []
        self._stripe_locks = [threading.Lock() for _ in range(self.stripes)]
        if os.path.exists(self.manifest_path):
            self._load_from_manifest()
        else:
            self.p0 = self.total_p * (1.0 - self.tighten)
            self._add_layer(0, hot=True if self.hot_ratio < 1.0 else False)
            self._persist_manifest()
        self._initialized = True

    @staticmethod
    def g(**kw): return bloom_controller(**kw)

    @staticmethod
    def _to_bytes(x):
        if isinstance(x, bytes):
            return x
        if isinstance(x, str):
            return x.encode("utf-8")
        if isinstance(x, int):
            if x == 0:
                return b"\x00"
            l = (x.bit_length() + 7) // 8
            return x.to_bytes(l, "big", signed=False)
        raise TypeError(f"Unsupported type: {type(x)!r}")

    @staticmethod
    def _opt_m(n,p): return max(8,int(math.ceil(-(n*math.log(p))/((math.log(2))**2))))
    @staticmethod
    def _opt_k(m,n): return max(1,int(round((m/n)*math.log(2))))
    def _rounded_bits(self,m): return ((m+self.block_bits-1)//self.block_bits)*self.block_bits
    def _layer_file(self,idx): return os.path.join(self.dirpath,f"layer_{idx}.bin")

    def _persist_manifest(self):
        meta={"capacity0":self.capacity0,"total_p":self.total_p,"growth":self.growth,"tighten":self.tighten,"max_fill":self.max_fill,
              "block_bits":self.block_bits,"stripes":self.stripes,"hot_ratio":self.hot_ratio,
              "layers":[{"n":L["n"],"p":L["p"],"m":L["m"],"k":L["k"],"path":L["path"],"bit_count":L["bit_count"]} for L in self.layers]}
        parent=os.path.dirname(self.manifest_path) or "."
        os.makedirs(parent,exist_ok=True)
        lock_path=self.manifest_path+".lock"
        with open(lock_path,"a+") as lf:
            fcntl.flock(lf.fileno(), fcntl.LOCK_EX)
            try:
                fd,tmp=tempfile.mkstemp(dir=parent,prefix=".manifest.",suffix=".tmp")
                try:
                    with os.fdopen(fd,"w",encoding="utf-8") as f:
                        json.dump(meta,f,ensure_ascii=False,separators=(",",":"))
                        f.flush()
                        os.fsync(f.fileno())
                    os.replace(tmp,self.manifest_path)
                finally:
                    if os.path.exists(tmp):
                        try: os.unlink(tmp)
                        except OSError: pass
                dfd=os.open(parent,os.O_DIRECTORY)
                try: os.fsync(dfd)
                finally: os.close(dfd)
            finally:
                fcntl.flock(lf.fileno(), fcntl.LOCK_UN)

    def _load_from_manifest(self):
        with open(self.manifest_path,"r") as f: meta=json.load(f)
        self.capacity0=meta["capacity0"]; self.total_p=meta["total_p"]; self.growth=meta["growth"]; self.tighten=meta["tighten"]
        self.max_fill=meta["max_fill"]; self.block_bits=meta["block_bits"]; self.stripes=meta["stripes"]; self.hot_ratio=meta.get("hot_ratio",0.01)
        self.p0=self.total_p*(1.0-self.tighten)
        self.layers=[]
        for i,Lm in enumerate(meta["layers"]):
            path=Lm["path"]; size_bytes=self._rounded_bits(Lm["m"])//8
            os.makedirs(os.path.dirname(path),exist_ok=True)
            fd=os.open(path,os.O_RDWR|os.O_CREAT); st=os.fstat(fd)
            if st.st_size!=size_bytes: os.ftruncate(fd,size_bytes)
            mm=mmap.mmap(fd,size_bytes,access=mmap.ACCESS_WRITE); os.close(fd)
            self.layers.append({"n":Lm["n"],"p":Lm["p"],"m":Lm["m"],"k":Lm["k"],"mm":mm,"path":path,"bit_count":int(Lm.get("bit_count",0))})

    def _add_layer(self,i,hot=False):
        if hot:
            n=max(1,int(round(self.capacity0*self.hot_ratio))); p=self.p0
        else:
            n=int(round(self.capacity0*(self.growth**i))); p=self.p0*(self.tighten**i)
        m=self._rounded_bits(self._opt_m(n,p)); k=self._opt_k(m,n)
        idx=len(self.layers); path=self._layer_file(idx); size_bytes=m//8
        fd=os.open(path,os.O_RDWR|os.O_CREAT); os.ftruncate(fd,size_bytes)
        mm=mmap.mmap(fd,size_bytes,access=mmap.ACCESS_WRITE); os.close(fd)
        self.layers.append({"n":n,"p":p,"m":m,"k":k,"mm":mm,"path":path,"bit_count":0})

    @staticmethod
    def _hpair(data):
        h1=int.from_bytes(hashlib.blake2b(data,digest_size=16).digest(),"big",signed=False)
        h2=int.from_bytes(hashlib.blake2s(data,digest_size=16).digest(),"big",signed=False) or 0x9e3779b97f4a7c15
        return h1,h2

    def _block_index(self,h1,m): return (h1%(m//self.block_bits))*self.block_bits
    def _indices_in_block(self,h1,h2,k):
        x=h1
        for i in range(k):
            x=(x+0x9e3779b97f4a7c15) & ((1<<128)-1)
            y=(x ^ (h2+i)) & ((1<<128)-1)
            yield y % self.block_bits
    def _stripe(self,bit_index): return ((bit_index//8)>>6) % self.stripes

    @staticmethod
    def _byte_get(mm,byte_index): return mm[byte_index]
    @staticmethod
    def _byte_set(mm,byte_index,value): mm[byte_index:byte_index+1]=bytes((value,))

    def _set_bit_with_count(self,L,bit_index):
        b,bit=divmod(bit_index,8); mm=L["mm"]; old=self._byte_get(mm,b); mask=1<<bit
        if (old & mask)==0:
            self._byte_set(mm,b,old|mask)
            L["bit_count"]+=1
            return True
        return False

    def _get_bit(self,L,bit_index):
        b,bit=divmod(bit_index,8); return (self._byte_get(L["mm"],b)>>bit)&1==1

    def _contains_layer_blocked(self,L,data):
        h1,h2=self._hpair(data); base=self._block_index(h1,L["m"])
        for off in self._indices_in_block(h1,h2,L["k"]):
            if not self._get_bit(L,base+off): return False
        return True

    def _add_layer_blocked(self,L,data):
        h1,h2=self._hpair(data); base=self._block_index(h1,L["m"])
        lk=self._stripe_locks[self._stripe(base)]
        with lk:
            for off in self._indices_in_block(h1,h2,L["k"]): self._set_bit_with_count(L,base+off)

    @staticmethod
    def _layer_fill(L):
        return L["bit_count"]/L["m"]

    def add(self,item):
        data=self._to_bytes(item); L=self.layers[-1]
        self._add_layer_blocked(L,data)
        if self._layer_fill(L)>=self.max_fill:
            self._add_layer(len(self.layers)); self._persist_manifest()

    def __contains__(self,item):
        data=self._to_bytes(item)
        for L in reversed(self.layers):
            if self._contains_layer_blocked(L,data): return True
        return False

    def isduplicate(self,text):
        data=self._to_bytes(text)
        for L in reversed(self.layers):
            if self._contains_layer_blocked(L,data): return True
        L=self.layers[-1]; self._add_layer_blocked(L,data)
        if self._layer_fill(L)>=self.max_fill:
            self._add_layer(len(self.layers)); self._persist_manifest()
        return False

    def flush(self):
        for L in self.layers: L["mm"].flush()
        self._persist_manifest()

    @staticmethod
    def load(dirpath=None):
        if dirpath is None:
            dirpath = os.path.abspath(os.path.join(os.getcwd(), "bloom_data"))
        os.makedirs(dirpath, exist_ok=True)
        return bloom_controller.g(dirpath=dirpath)
