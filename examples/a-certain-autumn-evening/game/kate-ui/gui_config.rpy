init offset = -2

init python:
    gui.init(1200, 720)

define _game_menu_screen = "game_menu"

define black = "#2f2f2f"
define white = "#fafafa"

define gui.text_preview = "This is how your text will look when you're reading it in the game. That includes pauses, and how quickly it displays."

define gui.hover_background = "#FBB880"
define gui.accent_color = "#FBB880"
define gui.text_color = black
define gui.gui_text_color = black

define gui.button_sound = "audio/sfx/click.wav"
define gui.focus_sound = "audio/sfx/beep.wav"

default show_quick_menu = True

style default:
  color gui.text_color
  language "unicode"

style text is empty:
  color gui.text_color
  size 24

style small_gui_text is text:
  color gui.gui_text_color
  size 18

style button:
  hover_sound gui.focus_sound
  activate_sound gui.button_sound