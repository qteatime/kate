init offset = -1

screen choice(items):
  style_prefix "choice"

  frame:
    vbox:
      for (index, item) in enumerate(items):
        textbutton item.caption action item.action default_focus (index == 0)

style choice_frame is empty
style choice_vbox is vbox
style choice_button is button
style choice_button_text is button_text

style choice_frame:
  background Frame("images/textbox.png", 32, 32)
  padding (0, 32)
  yalign 1.0
  yoffset -220
  xalign 0.5
  xoffset 350
  xfill False
  xsize 300

style choice_vbox:
  spacing 10

style choice_button:
  xfill True
  hover_background gui.accent_color
  ypadding 10
  activate_sound "audio/sfx/start.wav"

style choice_button_text:
  xalign 0.5
  color white
  hover_bold True
  hover_color black