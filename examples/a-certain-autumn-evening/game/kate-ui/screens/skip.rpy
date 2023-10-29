init offset = -1

screen skip_indicator():
  zorder 100
  style_prefix "skip"

  frame:
    hbox:
      spacing 4

      add "images/ctc.png" zoom 0.5 at delayed_blink(0.0, 1.0)
      add "images/ctc.png" zoom 0.5 at delayed_blink(0.2, 1.0)
      add "images/ctc.png" zoom 0.5 at delayed_blink(0.4, 1.0)

style skip_frame is empty
style skip_hbox is empty

style skip_frame:
  background white
  ysize 24
  xfill True
  ypos 0

style skip_hbox:
  xalign 1.0
  yalign 0.5
  xoffset -16