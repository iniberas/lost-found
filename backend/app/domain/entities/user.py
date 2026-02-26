class User:
    def __init__(self, id: int, username: str, email: str, password_hash: str):
        self._id = id
        self._username = username
        self._email = email
        self._password_hash = password_hash
    
    @property
    def id(self):
        return self._id
    
    @property
    def username(self):
        return self._username
    
    @property
    def email(self):
        return self._email
    
    @property
    def password_hash(self):
        return self._password_hash
    
    def verify_password(self, plain_password: str, hasher) -> bool:
        return hasher.verify(plain_password, self._password_hash)