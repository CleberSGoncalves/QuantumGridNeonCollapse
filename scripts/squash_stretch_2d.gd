# scripts/squash_stretch_2d.gd
# SquashStretch2D - Elastic Spring Damping Deformation
extends Node2D
class_name SquashStretch2D

@export var target_node: Node2D
@export var spring_strength: float = 180.0
@export var damping: float = 14.0

var scale_velocity: Vector2 = Vector2.ZERO
var target_scale: Vector2 = Vector2.ONE

func _ready() -> void:
	if not target_node:
		target_node = self

func _process(delta: float) -> void:
	if not target_node:
		return
	var diff = target_scale - target_node.scale
	var force = diff * spring_strength
	scale_velocity += force * delta
	scale_velocity -= scale_velocity * damping * delta
	target_node.scale += scale_velocity * delta

func apply_impulse(impulse: Vector2) -> void:
	scale_velocity += impulse

func squash_land() -> void:
	apply_impulse(Vector2(0.35, -0.35))

func stretch_jump() -> void:
	apply_impulse(Vector2(-0.25, 0.4))
