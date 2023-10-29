init offset = -1

screen _self_voicing():
  zorder 1500
  window:
    style_prefix "self_voicing"
    text _("Self-voicing enabled.") alt ""

style self_voicing_window is empty
style self_voicing_text is empty

style self_voicing_window:
  ypos 0
  xpos 0
  ysize 32
  xfill True
  background white

style self_voicing_text:
  xoffset 16
  yalign 0.5
  color black
  size 14
