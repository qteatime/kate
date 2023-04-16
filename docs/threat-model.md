# The Kate Threat Model

> **NOTE**: This is a living document. Information here applies to the latest experimental release.

Kate is a console emulator that can run arbitrary applications. Users download these applications from somewhere in the internet, install it in the emulator, and run them from the emulator. In that sense, it has a similar attack surface to that of another emulator or virtual machine.

Kate also allows these applications it runs to use certain features from the host device. The features are provided in high-level APIs, so applications do not have direct access to the underlying resources; still, this increases the attack surface beyond what regular console emulators face.

When deciding what features are added to Kate, and _how_ they are added, there are four Security Principles (SP) that we follow:

1. **Users should not need to trust application developers**.<br>
   The primary differentiating factor between games packaged for Kate and games packaged as native executables is that Kate cartridges are sandboxed by default. Cartridges have access to just enough features to make a playable game, but not cause security or privacy harm (intended or not).

2. **Developers should not need to trust other application developers.**<br>
   All cartridges are run in a fully isolated, fully sandboxed environment,
   meant to protect both users from applications, and applications from
   other applications. Kate likewise cannot tamper with applications'
   data integrity in any meaningful way, so users are unable to break
   applications (intented or not)—although they can reset them to defaults.

3. **Any dangerous feature should require meaningful consent.**<br>
   This means that users must be able to directly correlate cause and effect
   to verify if they are okay with the effect. In some cases this means
   that capabilities should be contextual and not long-lived. In other
   cases it means that a stronger trust relationship has to be established
   before access to features can be granted.

4. **Kate should never damage the host device.**<br>
   This means that no action taken in Kate, from any application, should
   be allowed to cause any damage to the host device. This means, for
   example, that access to the host file system can never be granted in
   any fashion—although Kate can provide sandboxed, high-level APIs that
   let applications manage their own data directly on the host's file
   system.

Features are also subject to the following Privacy Principles (PP):

1. **No data should be shared with a third party without meaningful consent.**<br>
   Kate should not allow cartridges to have passive access to any of the host data (e.g.: clipboard information), and it should not give them access to arbitrary Kate settings either, without user's explicit and meaningful consent.

2. **No data should be shared online without explicit consent.**<br>
   Kate should not allow cartridges to send data they collect from users to any internet location without the user's explicit consent. Ideally we would require meaningful consent, however Kate's support of WASM and JS runtimes make it tricky to track provenance.

This document goes into details on how Kate features are affected by these principles, and what exactly they mean in practice. We also expect that Single Mode distributions of Kate abide by these principles, however, as we're not the controlling party, there are no guarantees we can provide for those; this document thus does not deal with Single Mode distributions.

## Sandboxing model

### Reasoning

Cartridges in Kate contain applications written with arbitrary code in programming languages with ambient-authority (e.g.: WASM, JavaScript). Kate must still ensure that these applications are not granted any powerful API that can violate any of the SPs or PPs.

### Example

Anna publishes a Kate cartridge on her website, called "Catastrophy: Cats and Chaos". Brian finds this cartridge while looking for new games to play and figures games with cats are always a fun time.

Brian downloads the cartridge, installs it in Kate, and runs it in the emulator. Unknown to both Brian and Anna is the fact that, when Anna built this particular version, one of the JavaScript packages she uses for visual effects got compromised and was replaced by malicious code.

When Brian runs the cartridge, it loads the malicious library packaged with it. At first Brian plays the game normally and nothing seems out of the ordinary. However, there's a "It's better with these DLCs" link always on the screen. Curious, Brian clicks on it; the malicious library-controlled link redirects Brian to a malicious copy of the Itch.io site, asking for Brian's credit card information.

### Why is this dangerous?

Because Kate essentially runs web pages in the web-archive runtime, they have all the regular capabilities of normal web pages, but hardly much of the visual interface that a user could use to identify an attack.

For the particular example above, allowing a redirection to a website that looks just like a real game store, but is in fact malicious, would mean that players could never assess if the website was the real one or not: no URL or connection indicators would be present.

There are other issues with regular web pages that likewise violate most of Kate's SPs and PPs: for example, if the malicious library was allowed to issue capability requests on behalf of Anna's cartridge, Brian would never be able to know that these requests were, in fact, malicious in nature. The lack of boundaries between packages in JavaScript and etc. means that meaningful consent across all these trust boundaries is not possible, since there's no distinction between Anna's code and Malicious Library's code.

### How does Kate avoid this?

When Kate runs a cartridge with the web-archive runtime, it does so in a [Sandboxed IFrame](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#sandbox). This sandbox is also assigned a very restrictive [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).

Together, the aim of these restrictions is to:

- **Block any content that cannot be traced back to data in the cartridge.**<br>
  By not allowing redirections or remotely loaded content, a player can audit a cartridge for security and be sure that the audit will always be when the application is ran. But even without auditing, this means less moving parts that can be independently compromised, and less possibilities of phishing attacks performed by trying to confuse the player.

- **Block any access to powerful capabilities.**<br>
  Web browsers are getting more and more powerful capabilities lately (which is what enables Kate to exist at all). Rather than trying to keep up with the lists, Kate blocks access (and access requests) to all of them. Games instead get to use the high-level APIs that Kate provides, which uses specific cartridge identification instead of domain-based partitioning. Drawing APIs and pure APIs are not gated through capabilities.

Without powerful capabilities or remote contents granted to a cartridge, the attack above does not work. The browser will block the redirection and either (1) Brian will be annoyed that the link does not seem to work (errors are output only in developer console); or (2) the application may crash or show an error.

We consider that a broken cartridge (a cartridge that cannot make progress) is better than a successful attack, as the user will only be annoyed at the result, rather than actually harmed in any material way.

### Caveats

The sandboxing depends on how well implemented the rules are in web browsers. Modern web browsers are generally trusted with strong sandboxing capabilities, but as they're an ever changing target, growing more complex by the day, not mechanically proven, and offering users the possibility of enabling experimental/not-sufficiently-tested features, there's always a possibility that one could find an attack that bypasses the sandbox guarantees.

As Kate is not in control of the sandbox or feature addition, it has no power in stopping or tackling these bypasses. As such, we have to consider that this mitigation is in place only in so far as we can trust the specific browser with upholding its sandboxing guarantees.

## Screen capture model

### Reasoning

It's common in modern consoles (and fantasy consoles) to allow players to easily take a screenshot or record a video of their game play. Additional features steeming from this include sharing it on social media.

Kate wants to enable players to decide how to enjoy and communicate about the games they play, therefore it has built-in support for taking screenshots and recording videos of game play.

We still need to make sure that this is done in a way that does not put unreasonable strain on the device's resources and is done in a privacy-preserving way.

### Example

Elena often runs a cartridge called "Kitten Paint", which lets them sketch things using a stylus. The application does not really save the final image anywhere; to remediate that Elena uses the `Capture` button in their emulator to take a screenshot of the work when they're done painting.

Sometimes Elena also uploads videos of their drawing process on social media. To do so they hold the `Capture` button when they start painting, and hold it again when they're done.

They later push those video and image files on their image sharing social media account.

### Why is this dangerous?

Screen captures are generally unaware of different pieces of information as well as their privacy implications. For example, if the screen includes a password field that has been temporarily unmasked, screen capture would happily capture that password in the resulting image.

Even if users notice it later and crop the file to keep only the portion that can be shared publicly, they might fall victim of other computer issues, such as the [ACropalypse attack](https://en.wikipedia.org/wiki/ACropalypse).

Videos are worse, and people often struggle with things like "whole desktop capture" recording or streaming more than the user intended to. Even if a video is not long, it might still be difficult to audit all of its frames after the recording is done.

Further, when Kate is running on the web, it has no access to screen recording features, and must instead rely on browser's partial recording features instead. This means that the recording process essentially lives in the sandboxed cartridge's process, and is likewise controlled by the cartridge.

For example, this would mean that a cartridge can send data that is not being displayed on the screen, or send data to be stored even if the user had not performed any action.

### How does Kate mitigate this?

Kate has different mitigations here, intended to reduce the potential damage across different areas.

First, rather than recording the whole screen, Kate delegates to the cartridge to decide what it wants to be recorded. Cartridges then have full control over what information gets disclosed and when. While this is primarily done for platform limitations, cartridges are in a better position to make privacy-conscious decisions about the disclosing of their own contents, at least without pervasive provenance tracking in the runtime.

Second, recordings are gated by transient capabilities. The player needs to press the `Capture` button to grant one capability for saving a screenshot, or hold it to grant one capability for saving a video recording. Transient capabilities are gone after they're used, and they're only kept in memory for the current session. They're gone if the player closes Kate, but also if the player closes the cartridge and re-opens it.

Third, since there's no meaningful way of figuring out if what the cartridge is storing truly corresponds to what the player is seeing on the screen, Kate restricts the amount of data that can be stored with each of these transient capabilities. This means that a press of the `Capture` button always increases the usage of the storage by a bounded amount, preventing cartridges from filling the player's storage with garbage data.

### Caveats

The transient capabilities that Kate provides to the cartridge are trivially reconstructed by the cartridge's process, since it's a simple string. Kate relies on the fact that the strings are one-use and generated with a [cryptographically secure random number generator][csprng], to mitigate guessing.

Processes that send storage requests with unrecognised keys are terminated, with a message logged to the audit log and a notification of suspicious activity shown to the user. Because recording is generally handled by one of the injected Kate API scripts, it's unlikely that cartridges would accidentally trigger this scenario.

## Access to the Kate API

### Reasoning

Since all Kate cartridges are heavily sandboxed, there must be a different way of providing them with access to additional features that are commonly used in a video game, such as storing save data or reading cartridge files.

Kate provides this through an [IPC][ipc] channel that's secured with a capability key.

### Example

Lucas is building an RPG and aiming for it to be a fairly long one, so he adds an option for the player to save their game at certain points, both automatically and manually.

To do so, Lucas uses the Kate Storage API, and writes the game state on the device's local storage, associated with Lucas' cartridge.

Under the hood, the Kate Storage API requests the Kate OS process to store the data on the cartridge's behalf, which can then be correctly associated with the cartridge for storage quota restrictions and access purposes.

### Why is this dangerous?

Browsers have not been designed to run multiple applications in a single web-page; nor have they been designed to run multiple applications in a single domain. Sandboxing and security still expect distinct applications to be served from distinct domains, and websites often handle this by creating whole new origins for user content, when they mix those in.

Kate runs entirely offline, and cartridges are loaded from local storage, but each cartridge is essentially a distinct untrusted application. Kate must still uphold all of the SPs and PPs when running them in this shared space. This is partly achieved by the [Sandboxing Model](#sandboxing-model), which runs cartridges in a unique origin by using a sandboxed iframe.

This still leaves Kate with the job of making sure applications are isolated from each other—and from the OS. That applications cannot receive more capabilities than what the user granted them specifically. And that no application can single-handedly hog all of the user's device resources (such as storage space).

### How Kate mitigates this?

Each cartridge in Kate has an unique identifier, consisting of a namespace and a software identifier in that namespace. E.g.: `qteati.me/the-sound-of-rain` is one of these unique identifiers, where `qteati.me` is the namespace (by convention a domain name), and `the-sound-of-rain` is the software identifier.

Kate does not perform any verification on the provenance of these identifiers yet, however it requires that, once installed on the emulator, these identifiers are unique. There cannot be more than one cartridge installed with the same identifier.

The identifiers give us something other than the [network origin][origin] of the cartridge, and something that Kate can use to identify what capabilities a cartridge should have, and what storage bucket it should access. It follows that all data that can be associated with a cartridge gets tagged with the cartridge identifier, so Kate can gate access to it properly.

However, since the Kate API runs on the cartridge process, it cannot be trusted. Cartridges can tamper with the JavaScript environment in which the APIs run such that they do not have the intended semantics. We thus treat the Kate APIs as untrusted code that is part of the cartridge, rather than part of Kate.

In this way, the Kate APIs just send requests over an [IPC][ipc] channel, using a secret capability key that was negotiated when Kate runs the cartridge. The capability key is injected in the Kate APIs code and kept privately in memory, and Kate erases the injected key once it's consumed (and before cartridge-controlled code runs), however we do not trust the capability key to be uncompromised.

Because the cartridge can compromise the Kate APIs or send messages through the same IPC channel on its own, Kate has two additional layers of restrictions when a message is handled.

- After translating the capability key back to a process handler, in the Kate OS process, we verify that the source of that message matches the process we resolved the capability key to. This source is unforgeable, so ultimately the general [capability security guarantees][ocap] are preserved.

- Certain API usage is subject to further restrictions. For example, the [Capture API uses an additional token to associate the message with an explicit user action](#screen-capture-model), whereas the Storage API imposes a storage quota on the data stored to avoid cartridges hogging the entire device storage for themselves.

Messages that fail the first layer of restriction are marked as suspicious and will terminate the cartridge process, with a log entry in the audit log and a notification to the user. Since the Kate API is designed to comply with the first restriction, cartridges should not end up in this scenario accidentally.

### Caveats

While the restrictions in place mitigate possible harm caused with the use of the Kate APIs, there are a couple of attacks that they do not currently prevent such as degrading the storage by improper use, or spoofing identifiers to try gaining access to another cartridge's capabilities and data.

## Cartridge identification

### Reasoning

Because cartridges are stored locally (and thus not served from any [network origin][origin]), they need a different form of identification than the one browsers use for sandboxing. In Kate, this is the Cartridge Identifier.

A Cartridge Identifier is a unique string consisting of two parts: `<namespace>/<id>`, where the `<namespace>` part is an identifier of who publishes the cartridge, and the `<id>` part is an identifier of the cartridge itself, within that namespace.

For example, `qteati.me/the-sound-of-rain` is an identifier consisting of the publisher `qteati.me` and the cartridge `the-sound-of-rain`.

It goes without saying that Cartridge Identifiers are expected to be unique, as Kate's security features all rely on it.

### Example

Mika has finished her game "The Tower of Bones" and is now ready to publish it for other players to enjoy. Because Mika has an Itch.io account, she uses `mikamikanee.itch.io` as her namespace, and leaves the cartridge id as `the-tower-of-bones`.

The little creepy-cute rhythm game/dungeon crawler does better than she expected, and players are loving it. She publishes a couple more versions with bug fixes and improved features, and even an online co-op mode where four friends can brave a dungeon together.

A few weeks later, Ema, who left a couple of comments on the game page, is approached on Discord by someone claiming to be Mika. The person asks if Ema would like to beta-test a new version of the game with improved co-op, then sends Ema a cartridge file.

Because Kate tells players that they should be able to download any random file they find on the internet and run it with no harm, she downloads the cartridge and installs it, overwriting the one she had downloaded from the official Itch.io page.

Under the hood, the cartridge accesses all data it can and exfiltrates it to a remote origin under the malicious actor's control.

### Why is this dangerous?

Developers must have a way of providing updates for their games, so Kate must allow some way of installing a cartridge with an identifier that is already in the console. However, Kate also ties cartridge identifiers to capability and storage access on behalf of the developer of that cartridge.

This means that a malicious actor can publish cartridges under the same identifier as existing ones and inherit all of its capabilities and data. Although they must first trick users into installing their version of the cartridge, Kate's security PR where we encourage people to run any untrusted code they find in the console makes it difficult for users to figure this out; they are none-the-wiser about the provenance of such cartridges.

This is only aggravated by the fact that we want to encourage a decentralised way of publishing cartridges, rather than a centralised store—if a developer wants to publish their cartridges in Game Store A and Game Store B they should be able to, and players should be able to install it in the same way.

Fundamentally, however, this is an issue of provenance; users cannot give their meaningful, informed consent because they have no way of knowing if the person they got the cartridge from is the same person they've trusted before.

### How does Kate mitigate this?

Kate does not mitigate this currently. However, harm is severely reduced by the simple fact that the Kate APIs are not complete and currently don't include things like the ability of making network requests (thus, no way of exfiltrating data).

There are plans to address this with code signing, but the details of how that will happen are still not specified. If anything, Kate leans leans away from the hierarchical [Public Key Infrastructure][pki] model that powers the web, as we do not want to subject indie developers to the pain of having to deal with certificate authorities and its related costs.

Whatever ends up being decided must work for both developers (keeping the decentralised and accessible model of publishing cartridges) and users (not having to jump through hoops to install cartridges). There may be some interesting routes we can take with namespaces for propagating and trusting keys.

---

[csprng]: https://en.wikipedia.org/wiki/Cryptographically_secure_pseudorandom_number_generator
[ipc]: https://en.wikipedia.org/wiki/Inter-process_communication
[origin]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Origin
[ocap]: https://en.wikipedia.org/wiki/Object-capability_model
[wot]: https://en.wikipedia.org/wiki/Web_of_trust
[pki]: https://en.wikipedia.org/wiki/Public_key_infrastructure
