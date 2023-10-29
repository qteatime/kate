init offset = -1

screen quick_menu():
  null

screen quick_menu_buttons():
  zorder 100
  if show_quick_menu:
    window:
      style_prefix "quick"
      hbox:
        use quick_menu_button(kate_l, _("ROLLBACK"), action = Rollback())
        key ["kate_l"] action Rollback()
        use quick_menu_button(kate_r, _("SKIP"), action = Skip(), alternate = Skip(fast = True, confirm = True))
        use quick_menu_button(kate_cancel, _("AUTO-FORWARD"), action = Preference("auto-forward", "toggle"))
        key ["kate_sparkle"] action HideInterface()
        use quick_menu_button(kate_sparkle, _("HIDE UI"), action = HideInterface())
        key ["kate_x"] action Preference("auto-forward", "toggle")
        use quick_menu_button(kate_menu, _("MENU"), action = ShowMenu("game_menu"))


screen quick_menu_button(icon, title, **properties):
  button:
    properties properties
    style_prefix "quick_button"
    keyboard_focus False

    hbox:
      add icon zoom 0.065 yalign 0.5
      text title

style quick_window is empty
style quick_hbox is empty
style quick_button_button is button
style quick_button_hbox is empty
style quick_button_text is small_gui_text

style quick_window:
  yalign 1.0
  xalign 0.5
  yoffset -32
  ysize 24
  xsize 800

style quick_hbox:
  xalign 1.0
  xoffset -16
  spacing 15

style quick_button_button:
  yoffset 3

style quick_button_hbox:
  spacing 5

style quick_button_text:
  yalign 0.5
  size 14
  bold True
  color black
  hover_color "#B46C4F"
  selected_color "#B46C4F"