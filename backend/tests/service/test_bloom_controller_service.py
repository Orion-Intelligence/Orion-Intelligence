from __future__ import annotations

from pathlib import Path

from orion.services.bloom_manager.bloom_controller import bloom_controller


def _reset_bloom_singleton():
    bloom_controller._bloom_controller__instance = None


def test_bloom_controller_detects_duplicates_and_persists_file(tmp_path):
    _reset_bloom_singleton()
    try:
        controller = bloom_controller(capacity=100, error_rate=0.01, dirpath=tmp_path)

        assert Path(controller.path).parent == tmp_path
        assert controller.isduplicate("alpha-hash") is False
        assert controller.isduplicate("alpha-hash") is True
        assert Path(controller.path).exists()
    finally:
        _reset_bloom_singleton()


def test_bloom_controller_keeps_singleton_instance_configuration(tmp_path):
    first_dir = tmp_path / "first"
    second_dir = tmp_path / "second"

    _reset_bloom_singleton()
    try:
        first = bloom_controller(capacity=50, error_rate=0.05, dirpath=first_dir)
        second = bloom_controller(capacity=500, error_rate=0.001, dirpath=second_dir)

        assert first is second
        assert Path(second.path).parent == first_dir
    finally:
        _reset_bloom_singleton()
