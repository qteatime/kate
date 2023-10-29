transform animate_ctc:
  yalign 1.0
  xalign 0.5
  xoffset 380
  yoffset -110
  zoom 0.8

  block:
    ease 0.25 yoffset -100
    ease 0.25 yoffset -110
    pause 0.5
    repeat

transform delayed_blink(delay, cycle):
  alpha .5
  pause delay

  block:
    linear .2 alpha 1.0
    pause .2
    linear .2 alpha 0.5
    pause (cycle - .4)
    repeat