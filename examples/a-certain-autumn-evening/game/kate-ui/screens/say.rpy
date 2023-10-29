init offset = -1

screen say(who, what):
  style_prefix "say"

  window:
    id "window"

    if who is not None:
      window:
        id "namebox"
        style "namebox"
        text who id "who"

    text what id "what"
    add SideImage() xalign 0.0 yalign 1.0
  
  use quick_menu_buttons()

style say_window is empty
style namebox is empty
style namebox_label is say_label
style say_text is text
style say_thought is say_text
style say_dialogue is say_text

style say_window:
  background Frame("images/frame.png", 89, 90, tile = True)
  xalign 0.5
  yalign 1.0
  xsize 800
  ysize 250
  padding (32, 32)
  bottom_padding 64
  yoffset -16

style say_text:
  color white

style say_label:
  color gui.accent_color
  bold True
  size 32
  yoffset -24
  xoffset -8

style say_dialogue:
  yoffset 24

