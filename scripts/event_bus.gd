# scripts/event_bus.gd
# EventBus - Global Decoupled Signal Bus for Quantum Grid
extends Node

signal piece_picked(piece_id: String)
signal piece_placed(piece_id: String, row: int, col: int)
signal lines_collapsed(line_count: int, combo: int)
signal score_updated(new_score: int, high_score: int)
signal star_unlocked(star_num: int)
signal sector_completed(sector_id: int, stars: int)
signal game_over(final_score: int)
signal powerup_triggered(powerup_name: String)
