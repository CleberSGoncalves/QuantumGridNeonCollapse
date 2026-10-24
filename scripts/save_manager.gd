# scripts/save_manager.gd
# SaveManager - Versioned Local Persistence for Godot 4.x
extends Node

const SAVE_PATH: String = "user://quantum_grid_save_v1.json"

var save_data: Dictionary = {
	"version": 1,
	"high_score": 0,
	"coins": 200,
	"unlocked_sectors": 1,
	"sector_stars": {},
	"powerups": {
		"swap": 2,
		"emp": 1,
		"laser": 1
	}
}

func _ready() -> void:
	load_game()

func save_game() -> void:
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		var json_str = JSON.stringify(save_data)
		file.store_string(json_str)
		file.close()

func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var json_str = file.get_as_text()
		file.close()
		var parsed = JSON.parse_string(json_str)
		if parsed is Dictionary:
			save_data.merge(parsed, true)
