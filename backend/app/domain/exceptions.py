class DomainError(Exception):
    pass


class ValidationError(DomainError):
    pass


class StateTransitionError(DomainError):
    pass


class FutureDateError(ValidationError):
    pass
