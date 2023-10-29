init offset = -1

init python:
  class RestartableText(renpy.Displayable):
    def __init__(self, text, **properties):
      super(RestartableText, self).__init__()
      self.text = text
      self.properties = properties
      self.child = Text(text, slow_cps = preferences.text_cps, slow_done = self.on_slow_done, style="text_speed_test_text", **properties)
      self.start_st = None
      self.current_st = None
      self.wait_time = _preferences.afm_time

    def on_slow_done(self):
      self.mode = "wait"

    def update(self):
      self.child = Text(self.text, slow_cps = preferences.text_cps, slow_done = self.on_slow_done, style="text_speed_test_text", **self.properties)
      self.start_st = self.current_st
      self.wait_time = _preferences.afm_time

    def render(self, w, h, st, at):
      if self.start_st is None:
        self.start_st = st
      self.current_st = st

      renpy.redraw(self, 0)

      if self.wait_time > 0 and st - self.start_st > self.wait_time:
        self.update()

      return self.child.render(w, h, st - self.start_st, at)

screen text_speed_test(text):
  frame:
    style_prefix "text_speed_test"

    add text

style text_speed_test_frame is empty
style text_speed_test_text is text

style text_speed_test_text:
  slow_cps preferences.text_cps