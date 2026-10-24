# scripts/juice_camera_2d.gd
# JuiceCamera2D - Trauma² Screen Shake Implementation for Godot 4.x (GDScript 2.0)
extends Camera2D
class_name JuiceCamera2D

@export var decay: float = 1.6
@export var max_offset: Vector2 = Vector2(18.0, 18.0)
@export var max_roll: float = 0.06

var trauma: float = 0.0
var trauma_power: int = 2

func _ready() -> void:
	randomize()

func _process(delta: float) -> void:
	if trauma > 0.0:
		trauma = max(0.0, trauma - decay * delta)
		_shake()
	else:
		offset = Vector2.ZERO
		rotation = 0.0

func add_trauma(amount: float) -> void:
	trauma = min(1.0, trauma + amount)

func _shake() -> void:
	var amount = pow(trauma, trauma_power)
	rotation = max_roll * amount * randf_range(-1.0, 1.0)
	offset.x = max_offset.x * amount * randf_range(-1.0, 1.0)
	offset.y = max_offset.y * amount * randf_range(-1.0, 1.0)
