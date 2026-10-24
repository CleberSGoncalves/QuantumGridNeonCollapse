# scripts/hit_stop_manager.gd
# HitStopManager - Frame Freeze Impact Implementation for Godot 4.x
extends Node

var is_frozen: bool = false

func trigger(duration_ms: float = 50.0) -> void:
	if is_frozen:
		return
	is_frozen = true
	var tree = get_tree()
	if tree:
		tree.paused = true
		await tree.create_timer(duration_ms / 1000.0, true, false, true).timeout
		tree.paused = false
	is_frozen = false
