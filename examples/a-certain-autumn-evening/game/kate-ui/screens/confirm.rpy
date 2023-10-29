init offset = -1

screen confirm(message, yes_action, no_action):
  modal True
  zorder 400
  style_prefix "confirm"

  add "#2f2f2fcc"

  frame:
    vbox:
      label _(message):
        style "confirm_prompt"
    
      hbox:
        textbutton _("YES") action yes_action 
        textbutton _("NO") action no_action default_focus True
        key ["kate_x"] action no_action

  key "game_menu" action no_action

style confirm_frame is empty
style confirm_prompt is empty
style confirm_vbox is empty
style confirm_hbox is empty
style confirm_prompt_text is small_gui_text
style confirm_button is button
style confirm_button_text is small_gui_text

style confirm_frame:
  background Frame("images/frame.png", 89, 90, tile=True)
  padding (32, 32, 32, 16)
  xsize 600
  yminimum 180
  yfill False
  xalign 0.5
  yalign 0.5

style confirm_vbox:
  spacing 80

style confirm_prompt:
  xfill True

style confirm_prompt_text:
  xalign 0.5
  text_align 0.5
  size 24
  color white

style confirm_hbox:
  yalign 1.0
  spacing 50
  xalign 0.5

style confirm_button_text:
  bold True
  size 20
  hover_color gui.accent_color