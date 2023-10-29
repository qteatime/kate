init offset = -1

screen main_menu():
  tag menu

  add "images/title.png"

  vbox:
    style_prefix "main_menu"

    textbutton _("Start") activate_sound "audio/sfx/start.wav" action Start()
    textbutton _("Options") action ShowMenu("preferences")
    

style main_menu_vbox is empty
style main_menu_button is button
style main_menu_button_text is gui_text

style main_menu_vbox:
  xpos 50
  ypos 350
  xsize 250
  spacing 20

style main_menu_button:
  xfill True
  ysize 50

style main_menu_button_text:
  xalign 0.5
  yalign 0.5
  size 28
  color "#fafafa"
  hover_color "#FBB880"
  hover_size 36
  hover_bold True