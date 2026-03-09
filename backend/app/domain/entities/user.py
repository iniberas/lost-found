class User:
    def __init__(self, id: str, name: str, email: str, phone_number: str, password_hash: str):
        self._id = id
        self._name = name
        self._email = email
        self._phone_number = phone_number
        self._password_hash = password_hash
    
    @property
    def id(self):
        return self._id
    
    @property
    def name(self):
        return self._name
    
    @property
    def email(self):
        return self._email
    
    @property
    def phone_number(self):
        return self._phone_number
    
    @property
    def password_hash(self):
        return self._password_hash
    
    def verify_password(self, plain_password: str, hasher) -> bool:
        return hasher.verify(plain_password, self._password_hash)

    def update_name(self, new_name: str):
        # TODO: validasi input hehe ga tau disini atau ga :)
        self._name = new_name

    def update_email(self, new_email: str):
        # TODO: validasi input hehe ga tau disini atau ga :)
        self._email = new_email

    def update_phone_number(self, new_phone_number: str):
        # TODO: validasi input hehe ga tau disini atau ga :)
        self._phone_number = new_phone_number


class Admin(User):
    def __init__(self, id: int, name: str, email: str, phone_number: str, password_hash: str):
        super().__init__(id, name, email, phone_number, password_hash)
