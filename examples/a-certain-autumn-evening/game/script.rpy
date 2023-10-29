init python:
  renpy.add_layer("framing", above="master")

  def voice_beeps(event, interact=True, **kwargs):
    if not interact:
        return

    if event == "show_done":
        renpy.sound.play("audio/sfx/beep.wav", loop = True)
    elif event == "slow_done":
        renpy.sound.stop()

transform haunt:
  xalign 0.5
  xoffset 100
  ease 0.8 ypos -50
  pause 0.2
  ease 0.8 ypos 0
  pause 0.2
  repeat

transform middle:
  xalign 0.5
  xoffset 100

define ctc = At(Image("images/ctc.png"), animate_ctc)

define narrator = Character(None, ctc = ctc, ctc_pause = ctc, ctc_timedpause = Null(), ctc_position = "fixed", what_style = "say_thought")
define k = Character("Kate", ctc = ctc, ctc_pause = ctc, ctc_timedpause = Null(), ctc_position = "fixed", callback = voice_beeps)

image bg park = Image("images/park.png")
image kate idle = Image("images/kate.png")
image kate angry = Image("images/kate-angry.png")
image ghosts = Image("images/ghosts.png")
image overlay = Image("images/overlay.png")

label start:
    scene black
    with Dissolve(1.0)
    stop music
    pause 0.5

    show overlay onlayer framing
    scene black

    "Your cozy autumn evening stroll is interrupted when you bump into someone."

    play music "audio/bgm/apprentice-witch.ogg" fadein 1.0

    scene bg park
    show kate idle at middle
    with dissolve

    "The girl in front of you does not seem to mind much, still having her focus on the device she's carrying."

    menu:
      "The girl in front of you does not seem to mind much, still having her focus on the device she's carrying.{fast}"

      "Apologise":
        jump apologise

      "Excuse ME?":
        jump be_upset


label apologise:
  "You apologise."
  "You do have the habit of getting lost in thoughts while walking about, letting the sounds from your cat-eared headphones carry you to their own little world."
  "And this has happened so many times now that the apology comes almost instinctively."
  "The girl, however, does not seem to care much. She still has her focus on the device she's carrying."
  "It's a small handheld console, you haven't seen it before.{w} Or, at least, you don't remember seeing one of these before."
  "As the two of you stand there, awkwardly, she finally raises her head, taking a momentary look at you."

  show kate angry with dissolve

  k "Are you just going to stand there and stare at me or...?"

  menu:
    k "Are you just going to stand there and stare at me or...?{fast}"

    "Apologise":
      "You tell her you're sorry{w=0.5}, again."

  "She shakes her head, not paying you much more attention than that, and walking past you."

  hide kate with dissolve
  stop music fadeout 1.0

  "You think of turning around and asking her what's her problem, but you realise that the path in the park is quite narrow."
  "Standing in the middle of it, as you are now, she'd need to step over the grass on the side."
  "You didn't consider that a big deal, but perhaps she did."
  "You raise your shoulders, not wanting to give it much more thought than that. And, quite on cue, the next song kicks in."
  "There's a bit more walking before you reach the metro station, and your stomach has started hurrying you, longing for halloween treats."
  "It would be rude to keep it waiting."

  scene black
  with dissolve
  
  show screen ending("And they were both introverts.")
  with dissolve

  pause

  hide screen ending with dissolve

  return

label be_upset:
  "You would be the first one to apologise, usually. But today you've been running a bit... hot."
  "There were too many thoughts in your head, and, before you realised, you raised your voice."
  "It's a bit too late to take it back, so you have a better look at the person in front of you{w=.5}, for the first time."
  "The girl, however, still seems not to mind much."
  "She's standing like before, in front of you, with her attention entirely focused on the little device she carries."
  "It's a small handheld console, you think.{w=0.5} But you haven't seen one of these before."
  "You'd imagine all the kids nowadays would be carrying their Swatches, but this one is{w=.5}.{w=.4}.{w=.3}.{w=.5} certainly smaller."
  "It doesn't seem like she's about to move anytime soon; the path in this park is a bit too narrow with someone standing right in the middle of it."
  "And you'd rather not have your shoes find out what a dog-friendly park means by stepping aside yourself."
  
  menu:
    "And you'd rather not have your shoes find out what a dog-friendly park means by stepping aside yourself.{fast}"

    "I said excuse ME?":
      "You try again, louder this time.{w=0.5} You don't like raising your voice, but perhaps she, too, is wearing earphones."
      "You know a lot of people just go for the wireless earbuds nowadays; you personally can't let go of the comfort of your cat-eared headphones."

  "It seems speaking louder did the trick;{w=.5} the girl finally raises her head, looking at you momentarily."

  show kate angry with dissolve

  "She doesn't have the friendliest expression on her face, however.{w=.5} Understandably so."
  "You're almost apologising when something stops you."
  "Well, not {i}from apologising{/i}.{w=1.0} Just{w=.5}, stops you{w=.5}, in a more literal sense."
  "You don't quite know how to put this into words, but the moment she looked at you{w=0.5}—and the moment you could take a better look at her{w=0.5}—your entire body froze."
  "From under her cat-eared hoodie, the girl makes no other efforts to move. Her eyes remain fixed on you, intently."
  "You don't like it."
  "You would step aside if you could, but your lower limbs don't seem to answer to you presently."
  
  show ghosts at haunt with dissolve

  "And, perhaps, you might have been watching too many horror movies to get in the mood for the season."
  "You think."
  "You imagine your eyes deceive you.{w=.5} Either that or there truly are two floating ghost skulls by the girl's side."
  "Ghosts aren't real, you reason, so it must be something wrong with you.{w=1.0} You rub your eyes, just in case."

  show black with dissolve
  pause 0.5
  hide black with dissolve
  pause 0.5
  show black with dissolve
  hide black with dissolve
  

  "But the ghost skulls with cat-ears to each side{w=1.0}—or horns, you suppose{w=0.5}—the ghost skulls are still there."
  
  k "Are you just going to stand there and stare at me or...?"

  "Her tone is {i}not friendly{/i}."
  "You can't truly fault her here, though."
  "You {i}did{/i} raise your voice at her.{w} Twice."
  "And you're still staring{w=0.5}, though not exactly out of your own volition."
  "The two of you stand there, unmoving, for a few other moments."
  "Then, the girl raises her shoulder and shakes her head, walking around and past you."

  stop music fadeout 1.0
  hide kate
  hide ghosts
  with dissolve

  "The ghosts are likewise gone. Perhaps following her;{w=.5} you didn't entertain the idea of turning around to confirm."
  "Now that she's gone, you can move your body again."
  "You take a deep breath.{w} And another."
  "The next song kicks in just on cue."
  "An energetic dark pop song by a Japanese band you admire."
  "And it might have just the right effect on you; pushing your thoughts aside, you start walking down the path again."
  "The metro station you're headed to is still quite some way ahead, but your stomach is hurrying you, longing for the comfort of halloween treats."
  "It would be rude to keep it waiting."

  scene black
  with dissolve
  
  show screen ending("Sleep might be in order.")
  with dissolve

  pause

  hide screen ending with dissolve

  return

screen ending(Title):
  text Title:
    color white
    size 32
    xalign 1.0
    yalign 1.0
    xoffset -128
    yoffset -128