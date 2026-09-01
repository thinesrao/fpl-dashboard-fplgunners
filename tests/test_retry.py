import pytest
import requests
import gspread

from data_pipeline import with_retry, _is_transient


class _Resp:
    def __init__(self, status):
        self.status_code = status


def _http_error(status):
    err = requests.exceptions.HTTPError()
    err.response = _Resp(status)
    return err


def _api_error(status):
    err = gspread.exceptions.APIError.__new__(gspread.exceptions.APIError)
    err.response = _Resp(status)
    return err


def test_returns_immediately_on_success():
    calls = {"n": 0}

    def f():
        calls["n"] += 1
        return "ok"

    assert with_retry(f, attempts=3, base_delay=0) == "ok"
    assert calls["n"] == 1


def test_retries_transient_then_succeeds(monkeypatch):
    monkeypatch.setattr("data_pipeline.time.sleep", lambda _s: None)
    calls = {"n": 0}

    def f():
        calls["n"] += 1
        if calls["n"] < 3:
            raise requests.exceptions.ConnectionError("blip")
        return "ok"

    assert with_retry(f, attempts=4, base_delay=0.01) == "ok"
    assert calls["n"] == 3


def test_gives_up_after_attempts(monkeypatch):
    monkeypatch.setattr("data_pipeline.time.sleep", lambda _s: None)
    calls = {"n": 0}

    def f():
        calls["n"] += 1
        raise requests.exceptions.ConnectionError("still down")

    with pytest.raises(requests.exceptions.ConnectionError):
        with_retry(f, attempts=3, base_delay=0.01)
    assert calls["n"] == 3  # tried exactly `attempts` times, then re-raised


def test_permanent_4xx_is_not_retried():
    calls = {"n": 0}

    def f():
        calls["n"] += 1
        raise _http_error(404)

    with pytest.raises(requests.exceptions.HTTPError):
        with_retry(f, attempts=3, base_delay=0.01)
    assert calls["n"] == 1  # 404 is permanent — never retried


def test_is_transient_classification():
    assert _is_transient(_http_error(503)) is True          # server error
    assert _is_transient(_http_error(429)) is True          # rate limited
    assert _is_transient(_http_error(403)) is False         # permanent client error
    assert _is_transient(requests.exceptions.Timeout()) is True
    assert _is_transient(_api_error(503)) is True            # gspread 503
    assert _is_transient(ValueError("nope")) is False        # unrelated error
