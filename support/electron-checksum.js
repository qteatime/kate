/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const SHASUM = `
23a00d59fb5afd5c25be4f1e97091ddcb9ef1cbb77eba1146d5a9636eaf82161 *chromedriver-v26.2.2-darwin-arm64.zip
8e59d39f789bae98b6ecef667f5a5ca510eba6965e1272605d8f5999ab3fc09b *chromedriver-v26.2.2-darwin-x64.zip
9abdd4ca136b1ca9f4e3f26d38f148fdc61fab6b9fb8a53bb997f78a6fba5c7c *chromedriver-v26.2.2-linux-arm64.zip
dc0b33fb482af198c7d19a96d12f1eed5cd21d24cee2085d4a46d98ba3761afb *chromedriver-v26.2.2-linux-armv7l.zip
8fd2711bc96fb88033099575302d8578991f26aabf1461a8d3e8c95db67d26e8 *chromedriver-v26.2.2-linux-x64.zip
985cd4ce5b25cb76925da1559519611056e311c9cd3761d2e282f3be0b77c4c9 *chromedriver-v26.2.2-mas-arm64.zip
638ce6b6c2a69d93450f55100d19460665364a97a343738ca6508f4c73b1f232 *chromedriver-v26.2.2-mas-x64.zip
8fae91bba8083581aa897aa76805915d93f659233dfd960cc2b4e6733cf2a164 *chromedriver-v26.2.2-win32-arm64.zip
6fdeb9b4a2369a08e74136967efe88137ae88c2db9ffbe8565223cf35ed62031 *chromedriver-v26.2.2-win32-ia32.zip
0b9f3cefb3b9aea302dcb8e1d1bead23d8b91aa130c44ce5bcfd8a6c9e3fd0f0 *chromedriver-v26.2.2-win32-x64.zip
d42d33a04e5e506671f35fd34bf70533c655d9665d10d1efb60d98505dbed0e2 *electron-api.json
1888f25af61dcb07c071de9a77c4a5de2015965b6ab9180e8ddf13e5e75f77bf *electron-v26.2.2-darwin-arm64-dsym-snapshot.zip
6e42db4b8c448fa7ab62914d06eb03485519d362a23b58ab8d0b475f4ee17db6 *electron-v26.2.2-darwin-arm64-dsym.zip
7efe044bd662fda9112996bde9476f6952f194947b57b5ffdcced76cbab15a4a *electron-v26.2.2-darwin-arm64-symbols.zip
fc75e8955de8e4ad47bf1ca49263dd44d757cfcd029da5d0039cca1a0fa16b31 *electron-v26.2.2-darwin-arm64.zip
17a51fdfb7ef06bc779180e15b035571b5cdfa895716dcfadf6566ed24f963c7 *electron-v26.2.2-darwin-x64-dsym-snapshot.zip
9cbbe73e8809f60a2df9d5bcf87cf8a9adfa9a8a55e4658eb9fa76306e62d2d2 *electron-v26.2.2-darwin-x64-dsym.zip
1f3316d212502874d172c478314c939ebe6bd8d8c35ed46a1809fadb1ae13742 *electron-v26.2.2-darwin-x64-symbols.zip
eddc1340d7663766b3a5e6c91ed5b5a58947f1d23dc909eb20ad1e4bbcb1542a *electron-v26.2.2-darwin-x64.zip
62b4f59584d8f0e28ebb3a6763b0b2d9a45d03aa13bcdeb7383ca0b261bb00d0 *electron-v26.2.2-linux-arm64-debug.zip
3f03a3ad6266bf973501a78e89236c0587aa2fa7d531d4e04b60b52a0d0d08c5 *electron-v26.2.2-linux-arm64-symbols.zip
bceae2e9b9183507626524c41a7a2e3fb7b291c54fde01f9599baa415bc5200e *electron-v26.2.2-linux-arm64.zip
62b4f59584d8f0e28ebb3a6763b0b2d9a45d03aa13bcdeb7383ca0b261bb00d0 *electron-v26.2.2-linux-armv7l-debug.zip
44520580d710f9225620c1dae4ac074e6072b81b79c3afd25e490dec09d05e19 *electron-v26.2.2-linux-armv7l-symbols.zip
651cf76252ae90e683bb72d5aa0e6e4237568cb53a012aef116cfcf9a80d6ec8 *electron-v26.2.2-linux-armv7l.zip
b2dbdb861e9632c8e049877ecd4abc04904412162c5966117daaa83658defeef *electron-v26.2.2-linux-x64-debug.zip
674b769df9e65afd0cb34c038d732bf07779ceaee45f081585e53c4ab7d5ab6c *electron-v26.2.2-linux-x64-symbols.zip
f6717ba3caa429e665a0b7e3861a05e73e9f10eb179404ba1a1e4cb2533f4c0a *electron-v26.2.2-linux-x64.zip
1888f25af61dcb07c071de9a77c4a5de2015965b6ab9180e8ddf13e5e75f77bf *electron-v26.2.2-mas-arm64-dsym-snapshot.zip
08e18c11a9c721f5cdd8519809628024f6132388fd10c934ee2e4e46251ba3b9 *electron-v26.2.2-mas-arm64-dsym.zip
cd73f7fd945207bb782d03b5ab9a9f5700cde080a49d5f02527b393515528631 *electron-v26.2.2-mas-arm64-symbols.zip
a2ebf769db3997919edbe978f2acc1f97361a5cc7c24e03957aed16ee70b217d *electron-v26.2.2-mas-arm64.zip
1a6f40bafd2c54fa0b32c7e25ee9be78a700f3ab337949cab8e195fe24e5dd08 *electron-v26.2.2-mas-x64-dsym-snapshot.zip
5129a9cd73e02ae2ea8a563b3a2b6b20073d2603db7c0005d6d291cf8d18f841 *electron-v26.2.2-mas-x64-dsym.zip
3b9212b77372cf0ac5d15ab68bae29637ca8d0bff07aa9ec462850101efacbb5 *electron-v26.2.2-mas-x64-symbols.zip
0d560f3e2b46caa4fc1f6a4072c07d648d4c40ed65361dc54690801294046eed *electron-v26.2.2-mas-x64.zip
e80f673b5cc5314922fac85accbfb7685b750da1e3e4a521405468417ec9d0db *electron-v26.2.2-win32-arm64-pdb.zip
4669717a6bc6bbcc65a452db51207cd616e14d047f41b6161111d1e0784c6fde *electron-v26.2.2-win32-arm64-symbols.zip
e7b968fc53cc7a10a4ccb5133af045968479685ebb9617f06817f03667fdd425 *electron-v26.2.2-win32-arm64-toolchain-profile.zip
affb3eada199d264d6e721dbcf0dba413755e5d02202bce9a68276f5ff8867f9 *electron-v26.2.2-win32-arm64.zip
4bd07202ac4e0e22c2dab03671d3f91869748845a7f055eff41d3f4f6cf2fb72 *electron-v26.2.2-win32-ia32-pdb.zip
078c1dddc769a8553999157b489acb818347c0cfd5d60f40f27731968c48e353 *electron-v26.2.2-win32-ia32-symbols.zip
e7b968fc53cc7a10a4ccb5133af045968479685ebb9617f06817f03667fdd425 *electron-v26.2.2-win32-ia32-toolchain-profile.zip
185a6141e4c67cb19987499432195b654639359816cc16e79c0117bc1a15015f *electron-v26.2.2-win32-ia32.zip
097c60a4e746cf992234584eca1175a02c3f744cf43c0fd8ca6f822c7d15905e *electron-v26.2.2-win32-x64-pdb.zip
434b1f295e49026ae9658096c1cf70edd1234b166372c433c384bcb6a62c16dd *electron-v26.2.2-win32-x64-symbols.zip
e7b968fc53cc7a10a4ccb5133af045968479685ebb9617f06817f03667fdd425 *electron-v26.2.2-win32-x64-toolchain-profile.zip
26e7ead7db6b9acb2e904499321c0283d497add115a528157b8c3853e44fcefd *electron-v26.2.2-win32-x64.zip
c5dbfaa4cf32db86f6eebe4f41c9e2756d9ff9ef5d9cffc659892b444a26b5c6 *electron.d.ts
1044f4752979572b2c6544ae18a7cd6c4415ca8245587e96af84362f08aab2ca *ffmpeg-v26.2.2-darwin-arm64.zip
8bdff4d4d74b30ae39a59236102c5979aa396cc6828666a612c846dbce59f182 *ffmpeg-v26.2.2-darwin-x64.zip
d326b79c9b271c90c96e9a7c20e3742ad145c46779d7c8f6f1592614b5450156 *ffmpeg-v26.2.2-linux-arm64.zip
f16f1ef2bae1358985b5d7685935a2c181a4279f24c53d8901178e03994b6847 *ffmpeg-v26.2.2-linux-armv7l.zip
4568708d0ed0f4ac26737cfae460cd5a338cb78b1e05aa2661881c28efa275b2 *ffmpeg-v26.2.2-linux-x64.zip
83c5fb9a1b764bf3854679fa31334e84acb5b315dd329b2b834b6c053f4fface *ffmpeg-v26.2.2-mas-arm64.zip
244c72b2d62b9fd06599a8ae8dc2bb01125c5bec32d867f62bff0602d6505f19 *ffmpeg-v26.2.2-mas-x64.zip
765d2f80218112fdfd8401c43db371d49b07778de87324e61a46d9c2de791a4c *ffmpeg-v26.2.2-win32-arm64.zip
699e944dc7dc5a78556ced27de60689c778089b9c57dadf11b1245ee570a2835 *ffmpeg-v26.2.2-win32-ia32.zip
bfd4754b223c138848eec69639165dc881c44ca6f2188cd5c6bad0f1aadd0722 *ffmpeg-v26.2.2-win32-x64.zip
e627cce32e8f82d47c7a3d9893a067ee4cc1b4fd5167b28a92421a038febdc77 *hunspell_dictionaries.zip
add3e17f2bb179cb014d308df1c768f36e5ff9813be39a8b8d54867195de195a *libcxx-objects-v26.2.2-linux-arm64.zip
76393056f1a60c0928a648155b87a2e986fc77e3a7149d2c51746062648e004e *libcxx-objects-v26.2.2-linux-armv7l.zip
ea1b6b0d89da24018dca1034ac084d4714dd007ca5a1ed603e4427b0635a0d53 *libcxx-objects-v26.2.2-linux-x64.zip
aefdf121770af385f143c8c798deab78530b8322bcc0a417ac441a5102c3abcd *libcxx_headers.zip
f90b0cfc34bcc2b56bad3fc9de76f1a75f9d408d5c676a73263640f9a5c8e450 *libcxxabi_headers.zip
1c90f7f99334886104d24405f50c1cebf0a28130b0c7f9db25a9740bbd2dd8b2 *mksnapshot-v26.2.2-darwin-arm64.zip
c895ed04c2ed44b344c54d2cdd649049cbf5d24de0865e45022c8837ea8850e1 *mksnapshot-v26.2.2-darwin-x64.zip
4cd1d84410710de6440a5d4a2e1a6f6ee3b555d9929b6859d1b26f411eb02bb4 *mksnapshot-v26.2.2-linux-arm64-x64.zip
6974eaf775f561de16d1011cbaa57495d1ced400d994dea19d2d6e309c0d4b15 *mksnapshot-v26.2.2-linux-armv7l-x64.zip
34f66b7f1e32d2aa4c3a39b5d7324aa10176b10e7ee2ae86b70027a693073093 *mksnapshot-v26.2.2-linux-x64.zip
50859f1e5a9308fdb8ecf98577694d00f1203bbc2f95a506713d6be1eb80b8a7 *mksnapshot-v26.2.2-mas-arm64.zip
84d30b00e24300b355e4b41142f0f247e01452e7e661a82affc683a59376fe95 *mksnapshot-v26.2.2-mas-x64.zip
9c4a220925a05d68f3caa21a8f14784ceadae04ff694f2ccc720d06d146dc5a8 *mksnapshot-v26.2.2-win32-arm64-x64.zip
d32df16f6dfa7691e760fdeea2d4b99555aebed0fda90ebdf7a64ac33cdb1b36 *mksnapshot-v26.2.2-win32-ia32.zip
4ebd3094391f586bb8d30d6cff3105da9c6295cb97dd3201a840620fa94f5d1d *mksnapshot-v26.2.2-win32-x64.zip
`;

const checksum = new Map(
  SHASUM.trim()
    .split(/\r\n|\r|\n/)
    .map((line) => {
      const [hash, file0] = line.trim().split(/\s+/);
      const file = file0.trim().replace(/^\*/, "");
      return [file, hash];
    })
);

module.exports = checksum;
