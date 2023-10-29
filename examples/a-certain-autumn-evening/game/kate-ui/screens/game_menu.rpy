init offset = -1

screen game_menu(*args, **kwargs):
  style_prefix "game_menu"
  tag menu

  add "#f0f0f099"
  add "images/paused.png"

  vbox:
    use game_menu_button(_("Options"), action = ShowMenu("preferences"), default_focus = True)
    use game_menu_button(_("To title"), action = MainMenu())
    use game_menu_button(_("Return"), action = Return())
    key ["kate_x"] action Return()

screen game_menu_button(title, **properties):
  button:
    properties properties
    style_prefix "game_menu_button"
    text title

style game_menu_vbox is main_menu_vbox
style game_menu_button_button is main_menu_button
style game_menu_button_text is main_menu_button_text

