## This file contains options that can be changed to customize your game.
##
## Lines beginning with two '#' marks are comments, and you shouldn't uncomment
## them. Lines beginning with a single '#' mark are commented-out code, and you
## may want to uncomment them when appropriate.


## Basics ######################################################################
define config.name = _("A certain autumn evening...")
define config.version = "1.0"
define build.name = "autumn"

define config.check_conflicting_properties = True

## Sounds and music ############################################################
define config.has_sound = True
define config.has_music = True
define config.has_voice = False

define config.main_menu_music = "audio/bgm/apprentice-witch.ogg"


## Transitions #################################################################
define config.enter_transition = dissolve
define config.exit_transition = dissolve
define config.intra_transition = dissolve
define config.after_load_transition = None
define config.end_game_transition = dissolve

## Window management ###########################################################
define config.window = "auto"

define config.window_show_transition = Dissolve(.2)
define config.window_hide_transition = Dissolve(.2)


## Preference defaults #########################################################

default preferences.text_cps = 30
default preferences.afm_time = 15

define config.default_music_volume = 0.8
define config.default_sfx_volume = 1.0

define config.autosave_slots = 1
define config.quicksave_slots = 1
define config.has_autosave = False

## Save directory ##############################################################
define config.save_directory = "autumn-d6668be0"


## Icon ########################################################################
define config.window_icon = "images/icon.png"


## Build configuration #########################################################
init python:
    build.classify('**~', None)
    build.classify('**.bak', None)
    build.classify('**/.**', None)
    build.classify('**/#**', None)
    build.classify('**/thumbs.db', None)
    build.documentation('*.html')
    build.documentation('*.txt')
