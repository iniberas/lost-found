from datetime import datetime, timezone
from uuid import uuid4

import pytest
from app.domain.entities.contact_request import ContactRequest, RequestStatus
from app.domain.entities.user import User
from app.domain.exceptions import StateTransitionError, ValidationError


@pytest.fixture
def requester():
    return User.new_user("Requester", "req@example.com", "+628111111111", "hash")


@pytest.fixture
def target_user():
    return User.new_user("Target", "tgt@example.com", "+628222222222", "hash")


@pytest.fixture
def base_request_kwargs(requester, target_user):
    return {
        "requester": requester,
        "target_user": target_user,
        "report_id": uuid4(),
        "message": "Hello, I found your item.",
    }


def test_new_request_success(base_request_kwargs):
    req = ContactRequest.new_request(**base_request_kwargs)

    assert req.id is not None
    assert req.status == RequestStatus.PENDING
    assert req.requester == base_request_kwargs["requester"]
    assert req.target_user == base_request_kwargs["target_user"]
    assert req.report_id == base_request_kwargs["report_id"]
    assert req.message == base_request_kwargs["message"]
    assert req.created_at == req.updated_at
    assert req.responded_at is None


def test_new_request_fails_if_requester_is_target(requester):
    with pytest.raises(ValidationError, match="request your own contact"):
        ContactRequest.new_request(
            requester=requester,
            target_user=requester,
            report_id=uuid4(),
        )


@pytest.mark.parametrize(
    "invalid_message, expected_error",
    [
        ("", "Message cannot be empty"),
        ("   ", "Message cannot be empty"),
        ("A" * 1001, "cannot exceed 1000 characters"),
    ],
)
def test_new_request_fails_with_invalid_message(
    base_request_kwargs, invalid_message, expected_error
):
    base_request_kwargs["message"] = invalid_message
    with pytest.raises(ValidationError, match=expected_error):
        ContactRequest.new_request(**base_request_kwargs)


def test_approve_request(base_request_kwargs):
    req = ContactRequest.new_request(**base_request_kwargs)
    past_updated_at = req.updated_at

    req.approve()

    assert req.status == RequestStatus.APPROVED
    assert req.responded_at is not None
    assert req.updated_at > past_updated_at


def test_reject_request(base_request_kwargs):
    req = ContactRequest.new_request(**base_request_kwargs)

    req.reject()

    assert req.status == RequestStatus.REJECTED
    assert req.responded_at is not None


def test_cancel_request(base_request_kwargs):
    req = ContactRequest.new_request(**base_request_kwargs)

    req.cancel()

    assert req.status == RequestStatus.CANCELED
    assert req.responded_at is None  


def test_update_message_success(base_request_kwargs):
    req = ContactRequest.new_request(**base_request_kwargs)
    past_updated_at = req.updated_at

    req.update_message("Wait, new details here.")

    assert req.message == "Wait, new details here."
    assert req.updated_at > past_updated_at


@pytest.mark.parametrize(
    "method_name", ["approve", "reject", "cancel", "update_message"]
)
def test_mutations_fail_if_not_pending(base_request_kwargs, method_name):
    req = ContactRequest.new_request(**base_request_kwargs)
    req.approve()  

    with pytest.raises(StateTransitionError, match="already approved"):
        if method_name == "update_message":
            req.update_message("New Message")
        else:
            getattr(req, method_name)()


def test_create_fails_with_naive_datetime(requester, target_user):
    with pytest.raises(ValidationError, match="timezone"):
        ContactRequest(
            id=uuid4(),
            created_at=datetime(2024, 1, 1),  # Naive
            updated_at=datetime.now(timezone.utc),
            requester=requester,
            target_user=target_user,
            report_id=uuid4(),
            status=RequestStatus.PENDING,
        )
