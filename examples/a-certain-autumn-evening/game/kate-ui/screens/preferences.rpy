init offset = -1

define text_preview = RestartableText(gui.text_preview, slow = True)

init python:
  class PreferencesChangeTab(Action):
    def __init__(self, name, index, old, tabs):
      self.index = index
      self.name = name
      self.old = old
      self.tabs = tabs

    def __call__(self):
      index = self.index
      if index != self.old:
        renpy.sound.play(gui.button_sound)
        renpy.display.tts.speak(self.tabs[index])
        SetScreenVariable(self.name, index)()
        renpy.restart_interaction()
        renpy.display.focus.clear_focus()
        focus_first()

  def focus_first():
    # lifted from renpy.display.focus
    renpy.display.focus.focus_nearest(0.1, 0.9, 0.9, 0.9,
                                      0.1, 0.1, 0.9, 0.1,
                                      renpy.display.focus.horiz_line_dist,
                                      lambda old, new : old.y + old.h <= new.y,
                                      0, -1, 0, 0)

  @renpy.pure
  class SavePreferences(Action):
    def __call__(self):
      renpy.save_persistent()

screen preferences():
  tag menu
  $ tabs = ["Display", "Audio", "Accessibility"]
  default preferences_tab = 0
  

  fixed:
    style_prefix "preferences"

    add Solid("#f0f0f0")
    add "images/preferences.png"

    frame:
      style "preferences_content"

      if preferences_tab == 0:
        use preferences_display_page()
      elif preferences_tab == 1:
        use preferences_audio_page()
      elif preferences_tab == 2:
        use preferences_accessibility_page()

    
    vbox:
      style_prefix "preferences_menu"

      for (index, tab) in enumerate(tabs):
        textbutton tab:
          action SetScreenVariable("preferences_tab", index)
          selected (index == preferences_tab)
          keyboard_focus False
          default_focus False

    frame:
      style_prefix "preferences_status"

      hbox:
        style_prefix "preferences_status_tooltip"

        $ tooltip = GetTooltip()
        if tooltip is not None:
          text tooltip

      hbox:
        style_prefix "preferences_status_buttons"

        add kate_cancel_dark zoom 0.07 alt "Press CANCEL to return."
        if main_menu:
          textbutton _("BACK") alt "" action [SavePreferences(), ShowMenu("main_menu")]
          key ["kate_x"] action [SavePreferences(), ShowMenu("main_menu")]
        else:
          textbutton _("BACK") alt "" action [SavePreferences(), ShowMenu("game_menu")]
          key ["kate_x"] action [SavePreferences(), ShowMenu("game_menu")]

        null width 16

        if preferences_tab > 0:
          add kate_l_dark zoom 0.07 alt "Press L for {} options".format(tabs[preferences_tab - 1])

        if preferences_tab < len(tabs) - 1:
          add kate_r_dark zoom 0.07 alt "Press R for {} options".format(tabs[preferences_tab + 1])

        text _("CHANGE PAGE") alt ""

        key ["kate_r"] action [PreferencesChangeTab("preferences_tab", min(preferences_tab + 1, len(tabs) - 1), preferences_tab, tabs)]
        key ["kate_l"] action [PreferencesChangeTab("preferences_tab", max(preferences_tab - 1, 0), preferences_tab, tabs)]


screen preferences_display_page():
  python:
    def on_cps_changed():
      text_preview.update()
      renpy.restart_interaction()

  vbox:
    style_prefix "preferences_menu_list"

    select [
      {
        "value": False,
        "display": _("SEEN DIALOGUE"),
        "action": SetField(_preferences, "skip_unseen", False),
        "tooltip": _("Skip only previously seen dialogue.")
      },
      {
        "value": True,
        "display": _("ALL DIALOGUE"),
        "action": SetField(_preferences, "skip_unseen", True),
        "tooltip": _("Skip all dialogue.")
      }
    ]:
      label _("SKIP")
      value preferences.skip_unseen
      style_prefix "options_select"
      default_focus True

    select [
      {
        "value": True,
        "display": _("KEEP SKIPPING"),
        "action": SetField(_preferences, "skip_after_choices", True),
        "tooltip": _("Continue skipping after hitting a choice")
      },
      {
        "value": False,
        "display": _("STOP SKIPPING"),
        "action": SetField(_preferences, "skip_after_choices", False),
        "tooltip": _("Stop skipping after hitting a choice")
      }
    ]:
      label _("AFTER CHOICES")
      value preferences.skip_after_choices
      style_prefix "options_select"

    $ cps_ranges = [(5, _("VERY SLOW")), (15, _("SLOW")), (30, _("AVERAGE")), (50, _("FAST")), (100, _("VERY FAST")), (0, _("INSTANT"))]
    select [
      {
        "value": v,
        "display": d,
        "action": SetField(_preferences, "text_cps", v)
      } for (v, d) in cps_ranges
    ]:
      label _("TEXT SPEED")
      value preferences.text_cps
      tooltip _("How fast should text be displayed?")
      on_change on_cps_changed
      style_prefix "options_select"


    $ afm_ranges = [(0, _("NEVER")), (30, _("30 SECONDS")), (15, _("10 SECONDS")), (5, _("5 SECONDS"))]
    select [
      {
        "value": v,
        "display": d,
        "action": SetField(_preferences, "afm_time", v)
      } for (v, d) in afm_ranges
    ]:
      label _("AUTO-FORWARD AFTER")
      value preferences.afm_time
      tooltip _("How soon should we advance to the next dialogue?")
      on_change on_cps_changed
      style_prefix "options_select"

    null height 16

    frame:
      style "text_speed_test_container"

      use text_speed_test(text_preview)

screen preferences_audio_page():
  python:
    def make_pct(name):
      pct = [(0.0, _("Mute"))] + [(x / 10.0, "{}%".format(x * 10)) for x in range(1, 11)]
      return [
        {
          "value": v,
          "display": d,
          "action": SetMixer(name, v)
        } for (v, d) in pct
      ]

  vbox:
    style_prefix "preferences_menu_list"

    select make_pct("music"):
      label _("MUSIC VOLUME")
      value preferences.get_volume("music")
      tooltip _("Volume of the background music channel")
      default_focus True

    select make_pct("sfx"):
      label _("SOUND EFFECT VOLUME")
      value preferences.get_volume("sfx")
      tooltip _("Volume of the sound effects channel")

    if config.has_voice:
      select make_pct("voice"):
        label _("VOICE VOLUME")
        value preferences.get_volume("voice")
        tooltip _("Volume of the voice channel")

screen preferences_accessibility_page():
  vbox:
    style_prefix "preferences_menu_list"

    select [
      {
        "value": 2,
        "display": _("ENABLED"),
        "action": SetField(_preferences, "transitions", 2),
        "tooltip": _("Enable all transitions and animations")
      },
      {
        "value": 0,
        "display": _("DISABLED"),
        "action": SetField(_preferences, "transitions", 0),
        "tooltip": _("Disable all transitions and animations")
      }
    ]:
      label _("TRANSITIONS")
      value preferences.transitions
      default_focus True

    select [
      {
        "value": True,
        "display": _("ENABLED"),
        "action": SetField(_preferences, "self_voicing", True),
        "tooltip": _("Enable text-to-speech")
      },
      {
        "value": False,
        "display": _("DISABLED"),
        "action": SetField(_preferences, "self_voicing", False),
        "tooltip": _("Disable text-to-speech")
      }
    ]:
      label _("SELF-VOICING")
      value preferences.self_voicing

    select [
      {
        "value": None,
        "display": _("ORIGINAL FONTS"),
        "action": Preference("font transform", None),
        "tooltip": _("Use the original fonts for all text in the game")
      },
      {
        "value": "opendyslexic",
        "display": _("OPEN DYSLEXIC"),
        "action": Preference("font transform", "opendyslexic"),
        "tooltip": _("Use OpenDyslexic for all text in the game")
      }
    ]:
      label _("TEXT FONT")
      value preferences.font_transform

    $ font_sizes = [(0.8, _("SMALLER")), (1.0, _("ORIGINAL")), (1.2, _("LARGER"))]
    select  [
      {
        "value": v,
        "display": d,
        "action": [SetField(_preferences, "font_size", v), _DisplayReset()]
      } for (v, d) in font_sizes
    ]:
      label _("FONT SIZE")
      value preferences.font_size
      tooltip _("Scale the font sizes of all text in the game")


    select [
      {
        "value": True,
        "display": _("ENABLED"),
        "action": Preference("high contrast text", "enable"),
        "tooltip": "Favour contrast over the game's colours"
      },
      {
        "value": False,
        "display": _("DISABLED"),
        "action": Preference("high contrast text", "disable"),
        "tooltip": "Use the original text colours"
      }
    ]:
      label _("HIGH-CONTRAST TEXT")
      value preferences.high_contrast


style preferences_menu_vbox is empty
style preferences_menu_button is empty
style preferences_menu_button_text is gui_text
style preferences_content is empty
style preferences_status_frame is empty
style preferences_status_left_hbox is empty
style preferences_stauts_right_hbox is empty
style preferences_menu_list_vbox is vbox
style preferences_status_text is small_gui_text
style preferences_status_tooltip_text is preferences_status_text
style preferences_status_buttons_text is preferences_status_text
style preferences_status_buttons_button_text is preferences_status_buttons_text

style preferences_menu_vbox:
  xpos 50
  ypos 250
  xsize 250
  spacing 20

style preferences_menu_button:
  xfill True
  ysize 50

style preferences_menu_button_text:
  xalign 0.5
  yalign 0.5
  size 28
  color "#fafafa"
  hover_color "#FBB880"
  selected_size 36
  selected_color "#FBB880"
  selected_bold True

style preferences_content:
  xpos 500
  ypos 150
  xsize 650
  yfill True

style preferences_status_frame:
  xfill True
  ysize 50
  yalign 1.0
  xalign 1.0
  yoffset -8

style preferences_status_tooltip_hbox:
  yalign 0.5
  xalign 1.0
  xoffset -16
  xfill False

style preferences_status_buttons_hbox:
  yalign 0.5
  xalign 0.0
  xoffset 32
  spacing 8
  xfill False

style preferences_status_text:
  size 16
  bold True

style preferences_status_buttons_text:
  color white

style text_speed_test_container is empty
style text_speed_test_text is text

style text_speed_test_container:
  background Frame("images/textbox.png", 64, 64)
  padding (32, 32)

style text_speed_test_text:
  color white