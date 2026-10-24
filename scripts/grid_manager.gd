# scripts/grid_manager.gd
# GridManager - 8x8 Board Validation and Collapse Logic for Godot 4.x
extends Node
class_name GridManager

const GRID_SIZE: int = 8
var grid: Array = []

func _ready() -> void:
	reset_grid()

func reset_grid() -> void:
	grid.clear()
	for r in range(GRID_SIZE):
		var row = []
		for c in range(GRID_SIZE):
			row.append(null)
		grid.append(row)

func can_place(shape: Array, start_row: int, start_col: int) -> bool:
	var rows = shape.size()
	var cols = shape[0].size()
	if start_row < 0 or start_row + rows > GRID_SIZE:
		return false
	if start_col < 0 or start_col + cols > GRID_SIZE:
		return false

	for r in range(rows):
		for c in range(cols):
			if shape[r][c] == 1:
				if grid[start_row + r][start_col + c] != null:
					return false
	return true

func place(shape: Array, start_row: int, start_col: int, block_data: Dictionary) -> int:
	var rows = shape.size()
	var cols = shape[0].size()
	for r in range(rows):
		for c in range(cols):
			if shape[r][c] == 1:
				grid[start_row + r][start_col + c] = block_data

	return check_and_clear_lines()

func check_and_clear_lines() -> int:
	var full_rows = []
	for r in range(GRID_SIZE):
		var full = true
		for c in range(GRID_SIZE):
			if grid[r][c] == null:
				full = false
				break
		if full:
			full_rows.append(r)

	var full_cols = []
	for c in range(GRID_SIZE):
		var full = true
		for r in range(GRID_SIZE):
			if grid[r][c] == null:
				full = false
				break
		if full:
			full_cols.append(c)

	for r in full_rows:
		for c in range(GRID_SIZE):
			grid[r][c] = null

	for c in full_cols:
		for r in range(GRID_SIZE):
			grid[r][c] = null

	return full_rows.size() + full_cols.size()
