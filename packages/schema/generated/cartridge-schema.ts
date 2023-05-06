// This file was generated from a LJT schema.
export type Int8 = number;
export type Int16 = number;
export type Int32 = number;
export type UInt8 = number;
export type UInt16 = number;
export type UInt32 = number;
export type Float32 = number;
export type Float64 = number;


export interface Meta_security {
 readonly '@name': 'Meta-security';
 readonly '@tag': 8;
 readonly '@version': 0;
 readonly 'capabilities': (Capability)[]
}

export function Meta_security(x: {readonly 'capabilities': (Capability)[]}): Meta_security {
 return {
   '@name': 'Meta-security',
   '@tag': 8,
   '@version': 0,
   ...x
 };
}

Meta_security.tag = 8;



export interface Cartridge {
 readonly '@name': 'Cartridge';
 readonly '@tag': 0;
 readonly '@version': 0;
 readonly 'id': string;
  readonly 'metadata': Metadata;
  readonly 'files': (File)[];
  readonly 'platform': Platform
}

export function Cartridge(x: {readonly 'id': string,readonly 'metadata': Metadata,readonly 'files': (File)[],readonly 'platform': Platform}): Cartridge {
 return {
   '@name': 'Cartridge',
   '@tag': 0,
   '@version': 0,
   ...x
 };
}

Cartridge.tag = 0;



export interface File {
 readonly '@name': 'File';
 readonly '@tag': 1;
 readonly '@version': 0;
 readonly 'path': string;
  readonly 'mime': string;
  readonly 'data': Uint8Array
}

export function File(x: {readonly 'path': string,readonly 'mime': string,readonly 'data': Uint8Array}): File {
 return {
   '@name': 'File',
   '@tag': 1,
   '@version': 0,
   ...x
 };
}

File.tag = 1;



export interface Metadata {
 readonly '@name': 'Metadata';
 readonly '@tag': 2;
 readonly '@version': 0;
 readonly 'title': Meta_title;
  readonly 'release': Meta_release;
  readonly 'rating': Meta_rating;
  readonly 'play': Meta_play;
  readonly 'security': Meta_security;
  readonly 'extras': (Extra)[]
}

export function Metadata(x: {readonly 'title': Meta_title,readonly 'release': Meta_release,readonly 'rating': Meta_rating,readonly 'play': Meta_play,readonly 'security': Meta_security,readonly 'extras': (Extra)[]}): Metadata {
 return {
   '@name': 'Metadata',
   '@tag': 2,
   '@version': 0,
   ...x
 };
}

Metadata.tag = 2;



export interface Meta_title {
 readonly '@name': 'Meta-title';
 readonly '@tag': 3;
 readonly '@version': 0;
 readonly 'author': string;
  readonly 'title': string;
  readonly 'description': string;
  readonly 'genre': (Genre)[];
  readonly 'tags': (string)[];
  readonly 'thumbnail': File
}

export function Meta_title(x: {readonly 'author': string,readonly 'title': string,readonly 'description': string,readonly 'genre': (Genre)[],readonly 'tags': (string)[],readonly 'thumbnail': File}): Meta_title {
 return {
   '@name': 'Meta-title',
   '@tag': 3,
   '@version': 0,
   ...x
 };
}

Meta_title.tag = 3;



export interface Meta_release {
 readonly '@name': 'Meta-release';
 readonly '@tag': 4;
 readonly '@version': 0;
 readonly 'release-type': Release_type;
  readonly 'release-date': Date;
  readonly 'version': Version;
  readonly 'legal-notices': string;
  readonly 'licence-name': string;
  readonly 'allow-derivative': boolean;
  readonly 'allow-commercial': boolean
}

export function Meta_release(x: {readonly 'release-type': Release_type,readonly 'release-date': Date,readonly 'version': Version,readonly 'legal-notices': string,readonly 'licence-name': string,readonly 'allow-derivative': boolean,readonly 'allow-commercial': boolean}): Meta_release {
 return {
   '@name': 'Meta-release',
   '@tag': 4,
   '@version': 0,
   ...x
 };
}

Meta_release.tag = 4;



export interface Meta_rating {
 readonly '@name': 'Meta-rating';
 readonly '@tag': 5;
 readonly '@version': 0;
 readonly 'rating': Content_rating;
  readonly 'warnings': (string) | null
}

export function Meta_rating(x: {readonly 'rating': Content_rating,readonly 'warnings': (string) | null}): Meta_rating {
 return {
   '@name': 'Meta-rating',
   '@tag': 5,
   '@version': 0,
   ...x
 };
}

Meta_rating.tag = 5;



export interface Meta_play {
 readonly '@name': 'Meta-play';
 readonly '@tag': 6;
 readonly '@version': 0;
 readonly 'input-methods': (Input_method)[];
  readonly 'local-multiplayer': (Player_range) | null;
  readonly 'online-multiplayer': (Player_range) | null;
  readonly 'languages': (Language)[];
  readonly 'accessibility': (Accessibility)[];
  readonly 'average-duration': Duration
}

export function Meta_play(x: {readonly 'input-methods': (Input_method)[],readonly 'local-multiplayer': (Player_range) | null,readonly 'online-multiplayer': (Player_range) | null,readonly 'languages': (Language)[],readonly 'accessibility': (Accessibility)[],readonly 'average-duration': Duration}): Meta_play {
 return {
   '@name': 'Meta-play',
   '@tag': 6,
   '@version': 0,
   ...x
 };
}

Meta_play.tag = 6;



export type Extra = Extra.Booklet;

export namespace Extra {
 export const tag = 7;

 export const enum $Tags {
   Booklet = 0
 }

 
 export function Booklet(x: {readonly 'pages': (Booklet_expr)[],readonly 'custom-css': string,readonly 'language': string}): Extra {
   return {
     '@name': 'Extra',
     '@tag': 7,
     '@version': 0,
     '@variant': $Tags.Booklet,
     '@variant-name': 'Booklet',
     ...x
   }
 }

 export interface Booklet {
   readonly '@name': 'Extra';
   readonly '@tag': 7;
   readonly '@version': 0;
   readonly '@variant': $Tags.Booklet;
   readonly '@variant-name': 'Booklet';
   readonly 'pages': (Booklet_expr)[]
    readonly 'custom-css': string
    readonly 'language': string
 }

}



export type Capability = Capability.Network;

export namespace Capability {
 export const tag = 9;

 export const enum $Tags {
   Network = 0
 }

 
 export function Network(x: {readonly 'allow': (string)[]}): Capability {
   return {
     '@name': 'Capability',
     '@tag': 9,
     '@version': 0,
     '@variant': $Tags.Network,
     '@variant-name': 'Network',
     ...x
   }
 }

 export interface Network {
   readonly '@name': 'Capability';
   readonly '@tag': 9;
   readonly '@version': 0;
   readonly '@variant': $Tags.Network;
   readonly '@variant-name': 'Network';
   readonly 'allow': (string)[]
 }

}



export type Genre = Genre.Not_specified | Genre.Action | Genre.Figthing | Genre.Interactive_fiction | Genre.Platformer | Genre.Puzzle | Genre.Racing | Genre.Rhythm | Genre.RPG | Genre.Simulation | Genre.Shooter | Genre.Sports | Genre.Strategy | Genre.Tool | Genre.Other;

export namespace Genre {
 export const tag = 10;

 export const enum $Tags {
   Not_specified = 0,
    Action = 1,
    Figthing = 2,
    Interactive_fiction = 3,
    Platformer = 4,
    Puzzle = 5,
    Racing = 6,
    Rhythm = 7,
    RPG = 8,
    Simulation = 9,
    Shooter = 10,
    Sports = 11,
    Strategy = 12,
    Tool = 13,
    Other = 14
 }

 
 export function Not_specified(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Not_specified,
     '@variant-name': 'Not-specified',
     ...x
   }
 }

 export interface Not_specified {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Not_specified;
   readonly '@variant-name': 'Not-specified';
   
 }


  
 export function Action(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Action,
     '@variant-name': 'Action',
     ...x
   }
 }

 export interface Action {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Action;
   readonly '@variant-name': 'Action';
   
 }


  
 export function Figthing(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Figthing,
     '@variant-name': 'Figthing',
     ...x
   }
 }

 export interface Figthing {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Figthing;
   readonly '@variant-name': 'Figthing';
   
 }


  
 export function Interactive_fiction(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Interactive_fiction,
     '@variant-name': 'Interactive-fiction',
     ...x
   }
 }

 export interface Interactive_fiction {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Interactive_fiction;
   readonly '@variant-name': 'Interactive-fiction';
   
 }


  
 export function Platformer(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Platformer,
     '@variant-name': 'Platformer',
     ...x
   }
 }

 export interface Platformer {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Platformer;
   readonly '@variant-name': 'Platformer';
   
 }


  
 export function Puzzle(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Puzzle,
     '@variant-name': 'Puzzle',
     ...x
   }
 }

 export interface Puzzle {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Puzzle;
   readonly '@variant-name': 'Puzzle';
   
 }


  
 export function Racing(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Racing,
     '@variant-name': 'Racing',
     ...x
   }
 }

 export interface Racing {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Racing;
   readonly '@variant-name': 'Racing';
   
 }


  
 export function Rhythm(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Rhythm,
     '@variant-name': 'Rhythm',
     ...x
   }
 }

 export interface Rhythm {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Rhythm;
   readonly '@variant-name': 'Rhythm';
   
 }


  
 export function RPG(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.RPG,
     '@variant-name': 'RPG',
     ...x
   }
 }

 export interface RPG {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.RPG;
   readonly '@variant-name': 'RPG';
   
 }


  
 export function Simulation(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Simulation,
     '@variant-name': 'Simulation',
     ...x
   }
 }

 export interface Simulation {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Simulation;
   readonly '@variant-name': 'Simulation';
   
 }


  
 export function Shooter(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Shooter,
     '@variant-name': 'Shooter',
     ...x
   }
 }

 export interface Shooter {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Shooter;
   readonly '@variant-name': 'Shooter';
   
 }


  
 export function Sports(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Sports,
     '@variant-name': 'Sports',
     ...x
   }
 }

 export interface Sports {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Sports;
   readonly '@variant-name': 'Sports';
   
 }


  
 export function Strategy(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Strategy,
     '@variant-name': 'Strategy',
     ...x
   }
 }

 export interface Strategy {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Strategy;
   readonly '@variant-name': 'Strategy';
   
 }


  
 export function Tool(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Tool,
     '@variant-name': 'Tool',
     ...x
   }
 }

 export interface Tool {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Tool;
   readonly '@variant-name': 'Tool';
   
 }


  
 export function Other(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 10,
     '@version': 0,
     '@variant': $Tags.Other,
     '@variant-name': 'Other',
     ...x
   }
 }

 export interface Other {
   readonly '@name': 'Genre';
   readonly '@tag': 10;
   readonly '@version': 0;
   readonly '@variant': $Tags.Other;
   readonly '@variant-name': 'Other';
   
 }

}



export type Release_type = Release_type.Prototype | Release_type.Early_access | Release_type.Beta | Release_type.Demo | Release_type.Full;

export namespace Release_type {
 export const tag = 11;

 export const enum $Tags {
   Prototype = 0,
    Early_access = 1,
    Beta = 2,
    Demo = 3,
    Full = 4
 }

 
 export function Prototype(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 11,
     '@version': 0,
     '@variant': $Tags.Prototype,
     '@variant-name': 'Prototype',
     ...x
   }
 }

 export interface Prototype {
   readonly '@name': 'Release-type';
   readonly '@tag': 11;
   readonly '@version': 0;
   readonly '@variant': $Tags.Prototype;
   readonly '@variant-name': 'Prototype';
   
 }


  
 export function Early_access(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 11,
     '@version': 0,
     '@variant': $Tags.Early_access,
     '@variant-name': 'Early-access',
     ...x
   }
 }

 export interface Early_access {
   readonly '@name': 'Release-type';
   readonly '@tag': 11;
   readonly '@version': 0;
   readonly '@variant': $Tags.Early_access;
   readonly '@variant-name': 'Early-access';
   
 }


  
 export function Beta(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 11,
     '@version': 0,
     '@variant': $Tags.Beta,
     '@variant-name': 'Beta',
     ...x
   }
 }

 export interface Beta {
   readonly '@name': 'Release-type';
   readonly '@tag': 11;
   readonly '@version': 0;
   readonly '@variant': $Tags.Beta;
   readonly '@variant-name': 'Beta';
   
 }


  
 export function Demo(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 11,
     '@version': 0,
     '@variant': $Tags.Demo,
     '@variant-name': 'Demo',
     ...x
   }
 }

 export interface Demo {
   readonly '@name': 'Release-type';
   readonly '@tag': 11;
   readonly '@version': 0;
   readonly '@variant': $Tags.Demo;
   readonly '@variant-name': 'Demo';
   
 }


  
 export function Full(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 11,
     '@version': 0,
     '@variant': $Tags.Full,
     '@variant-name': 'Full',
     ...x
   }
 }

 export interface Full {
   readonly '@name': 'Release-type';
   readonly '@tag': 11;
   readonly '@version': 0;
   readonly '@variant': $Tags.Full;
   readonly '@variant-name': 'Full';
   
 }

}



export interface Version {
 readonly '@name': 'Version';
 readonly '@tag': 12;
 readonly '@version': 0;
 readonly 'major': UInt32;
  readonly 'minor': UInt32
}

export function Version(x: {readonly 'major': UInt32,readonly 'minor': UInt32}): Version {
 return {
   '@name': 'Version',
   '@tag': 12,
   '@version': 0,
   ...x
 };
}

Version.tag = 12;



export type Content_rating = Content_rating.General | Content_rating.Teen_and_up | Content_rating.Mature | Content_rating.Explicit | Content_rating.Unknown;

export namespace Content_rating {
 export const tag = 13;

 export const enum $Tags {
   General = 0,
    Teen_and_up = 1,
    Mature = 2,
    Explicit = 3,
    Unknown = 4
 }

 
 export function General(x: {}): Content_rating {
   return {
     '@name': 'Content-rating',
     '@tag': 13,
     '@version': 0,
     '@variant': $Tags.General,
     '@variant-name': 'General',
     ...x
   }
 }

 export interface General {
   readonly '@name': 'Content-rating';
   readonly '@tag': 13;
   readonly '@version': 0;
   readonly '@variant': $Tags.General;
   readonly '@variant-name': 'General';
   
 }


  
 export function Teen_and_up(x: {}): Content_rating {
   return {
     '@name': 'Content-rating',
     '@tag': 13,
     '@version': 0,
     '@variant': $Tags.Teen_and_up,
     '@variant-name': 'Teen-and-up',
     ...x
   }
 }

 export interface Teen_and_up {
   readonly '@name': 'Content-rating';
   readonly '@tag': 13;
   readonly '@version': 0;
   readonly '@variant': $Tags.Teen_and_up;
   readonly '@variant-name': 'Teen-and-up';
   
 }


  
 export function Mature(x: {}): Content_rating {
   return {
     '@name': 'Content-rating',
     '@tag': 13,
     '@version': 0,
     '@variant': $Tags.Mature,
     '@variant-name': 'Mature',
     ...x
   }
 }

 export interface Mature {
   readonly '@name': 'Content-rating';
   readonly '@tag': 13;
   readonly '@version': 0;
   readonly '@variant': $Tags.Mature;
   readonly '@variant-name': 'Mature';
   
 }


  
 export function Explicit(x: {}): Content_rating {
   return {
     '@name': 'Content-rating',
     '@tag': 13,
     '@version': 0,
     '@variant': $Tags.Explicit,
     '@variant-name': 'Explicit',
     ...x
   }
 }

 export interface Explicit {
   readonly '@name': 'Content-rating';
   readonly '@tag': 13;
   readonly '@version': 0;
   readonly '@variant': $Tags.Explicit;
   readonly '@variant-name': 'Explicit';
   
 }


  
 export function Unknown(x: {}): Content_rating {
   return {
     '@name': 'Content-rating',
     '@tag': 13,
     '@version': 0,
     '@variant': $Tags.Unknown,
     '@variant-name': 'Unknown',
     ...x
   }
 }

 export interface Unknown {
   readonly '@name': 'Content-rating';
   readonly '@tag': 13;
   readonly '@version': 0;
   readonly '@variant': $Tags.Unknown;
   readonly '@variant-name': 'Unknown';
   
 }

}



export interface Date {
 readonly '@name': 'Date';
 readonly '@tag': 14;
 readonly '@version': 0;
 readonly 'year': UInt32;
  readonly 'month': UInt8;
  readonly 'day': UInt8
}

export function Date(x: {readonly 'year': UInt32,readonly 'month': UInt8,readonly 'day': UInt8}): Date {
 return {
   '@name': 'Date',
   '@tag': 14,
   '@version': 0,
   ...x
 };
}

Date.tag = 14;



export type Duration = Duration.Seconds | Duration.Few_minutes | Duration.Half_hour | Duration.One_hour | Duration.Few_hours | Duration.Several_hours | Duration.Unknown;

export namespace Duration {
 export const tag = 15;

 export const enum $Tags {
   Seconds = 0,
    Few_minutes = 1,
    Half_hour = 2,
    One_hour = 3,
    Few_hours = 4,
    Several_hours = 5,
    Unknown = 6
 }

 
 export function Seconds(x: {}): Duration {
   return {
     '@name': 'Duration',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Seconds,
     '@variant-name': 'Seconds',
     ...x
   }
 }

 export interface Seconds {
   readonly '@name': 'Duration';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Seconds;
   readonly '@variant-name': 'Seconds';
   
 }


  
 export function Few_minutes(x: {}): Duration {
   return {
     '@name': 'Duration',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Few_minutes,
     '@variant-name': 'Few-minutes',
     ...x
   }
 }

 export interface Few_minutes {
   readonly '@name': 'Duration';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Few_minutes;
   readonly '@variant-name': 'Few-minutes';
   
 }


  
 export function Half_hour(x: {}): Duration {
   return {
     '@name': 'Duration',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Half_hour,
     '@variant-name': 'Half-hour',
     ...x
   }
 }

 export interface Half_hour {
   readonly '@name': 'Duration';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Half_hour;
   readonly '@variant-name': 'Half-hour';
   
 }


  
 export function One_hour(x: {}): Duration {
   return {
     '@name': 'Duration',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.One_hour,
     '@variant-name': 'One-hour',
     ...x
   }
 }

 export interface One_hour {
   readonly '@name': 'Duration';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.One_hour;
   readonly '@variant-name': 'One-hour';
   
 }


  
 export function Few_hours(x: {}): Duration {
   return {
     '@name': 'Duration',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Few_hours,
     '@variant-name': 'Few-hours',
     ...x
   }
 }

 export interface Few_hours {
   readonly '@name': 'Duration';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Few_hours;
   readonly '@variant-name': 'Few-hours';
   
 }


  
 export function Several_hours(x: {}): Duration {
   return {
     '@name': 'Duration',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Several_hours,
     '@variant-name': 'Several-hours',
     ...x
   }
 }

 export interface Several_hours {
   readonly '@name': 'Duration';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Several_hours;
   readonly '@variant-name': 'Several-hours';
   
 }


  
 export function Unknown(x: {}): Duration {
   return {
     '@name': 'Duration',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Unknown,
     '@variant-name': 'Unknown',
     ...x
   }
 }

 export interface Unknown {
   readonly '@name': 'Duration';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Unknown;
   readonly '@variant-name': 'Unknown';
   
 }

}



export type Input_method = Input_method.Kate_buttons | Input_method.Touch;

export namespace Input_method {
 export const tag = 16;

 export const enum $Tags {
   Kate_buttons = 0,
    Touch = 1
 }

 
 export function Kate_buttons(x: {}): Input_method {
   return {
     '@name': 'Input-method',
     '@tag': 16,
     '@version': 0,
     '@variant': $Tags.Kate_buttons,
     '@variant-name': 'Kate-buttons',
     ...x
   }
 }

 export interface Kate_buttons {
   readonly '@name': 'Input-method';
   readonly '@tag': 16;
   readonly '@version': 0;
   readonly '@variant': $Tags.Kate_buttons;
   readonly '@variant-name': 'Kate-buttons';
   
 }


  
 export function Touch(x: {}): Input_method {
   return {
     '@name': 'Input-method',
     '@tag': 16,
     '@version': 0,
     '@variant': $Tags.Touch,
     '@variant-name': 'Touch',
     ...x
   }
 }

 export interface Touch {
   readonly '@name': 'Input-method';
   readonly '@tag': 16;
   readonly '@version': 0;
   readonly '@variant': $Tags.Touch;
   readonly '@variant-name': 'Touch';
   
 }

}



export interface Player_range {
 readonly '@name': 'Player-range';
 readonly '@tag': 17;
 readonly '@version': 0;
 readonly 'minimum': UInt32;
  readonly 'maximum': UInt32
}

export function Player_range(x: {readonly 'minimum': UInt32,readonly 'maximum': UInt32}): Player_range {
 return {
   '@name': 'Player-range',
   '@tag': 17,
   '@version': 0,
   ...x
 };
}

Player_range.tag = 17;



export interface Language {
 readonly '@name': 'Language';
 readonly '@tag': 18;
 readonly '@version': 0;
 readonly 'iso-code': string;
  readonly 'interface': boolean;
  readonly 'audio': boolean;
  readonly 'text': boolean
}

export function Language(x: {readonly 'iso-code': string,readonly 'interface': boolean,readonly 'audio': boolean,readonly 'text': boolean}): Language {
 return {
   '@name': 'Language',
   '@tag': 18,
   '@version': 0,
   ...x
 };
}

Language.tag = 18;



export type Accessibility = Accessibility.High_contrast | Accessibility.Subtitles | Accessibility.Image_captions | Accessibility.Voiced_text | Accessibility.Configurable_difficulty | Accessibility.Skippable_content;

export namespace Accessibility {
 export const tag = 19;

 export const enum $Tags {
   High_contrast = 0,
    Subtitles = 1,
    Image_captions = 2,
    Voiced_text = 3,
    Configurable_difficulty = 4,
    Skippable_content = 5
 }

 
 export function High_contrast(x: {}): Accessibility {
   return {
     '@name': 'Accessibility',
     '@tag': 19,
     '@version': 0,
     '@variant': $Tags.High_contrast,
     '@variant-name': 'High-contrast',
     ...x
   }
 }

 export interface High_contrast {
   readonly '@name': 'Accessibility';
   readonly '@tag': 19;
   readonly '@version': 0;
   readonly '@variant': $Tags.High_contrast;
   readonly '@variant-name': 'High-contrast';
   
 }


  
 export function Subtitles(x: {}): Accessibility {
   return {
     '@name': 'Accessibility',
     '@tag': 19,
     '@version': 0,
     '@variant': $Tags.Subtitles,
     '@variant-name': 'Subtitles',
     ...x
   }
 }

 export interface Subtitles {
   readonly '@name': 'Accessibility';
   readonly '@tag': 19;
   readonly '@version': 0;
   readonly '@variant': $Tags.Subtitles;
   readonly '@variant-name': 'Subtitles';
   
 }


  
 export function Image_captions(x: {}): Accessibility {
   return {
     '@name': 'Accessibility',
     '@tag': 19,
     '@version': 0,
     '@variant': $Tags.Image_captions,
     '@variant-name': 'Image-captions',
     ...x
   }
 }

 export interface Image_captions {
   readonly '@name': 'Accessibility';
   readonly '@tag': 19;
   readonly '@version': 0;
   readonly '@variant': $Tags.Image_captions;
   readonly '@variant-name': 'Image-captions';
   
 }


  
 export function Voiced_text(x: {}): Accessibility {
   return {
     '@name': 'Accessibility',
     '@tag': 19,
     '@version': 0,
     '@variant': $Tags.Voiced_text,
     '@variant-name': 'Voiced-text',
     ...x
   }
 }

 export interface Voiced_text {
   readonly '@name': 'Accessibility';
   readonly '@tag': 19;
   readonly '@version': 0;
   readonly '@variant': $Tags.Voiced_text;
   readonly '@variant-name': 'Voiced-text';
   
 }


  
 export function Configurable_difficulty(x: {}): Accessibility {
   return {
     '@name': 'Accessibility',
     '@tag': 19,
     '@version': 0,
     '@variant': $Tags.Configurable_difficulty,
     '@variant-name': 'Configurable-difficulty',
     ...x
   }
 }

 export interface Configurable_difficulty {
   readonly '@name': 'Accessibility';
   readonly '@tag': 19;
   readonly '@version': 0;
   readonly '@variant': $Tags.Configurable_difficulty;
   readonly '@variant-name': 'Configurable-difficulty';
   
 }


  
 export function Skippable_content(x: {}): Accessibility {
   return {
     '@name': 'Accessibility',
     '@tag': 19,
     '@version': 0,
     '@variant': $Tags.Skippable_content,
     '@variant-name': 'Skippable-content',
     ...x
   }
 }

 export interface Skippable_content {
   readonly '@name': 'Accessibility';
   readonly '@tag': 19;
   readonly '@version': 0;
   readonly '@variant': $Tags.Skippable_content;
   readonly '@variant-name': 'Skippable-content';
   
 }

}



export type Booklet_expr = Booklet_expr.BE_text | Booklet_expr.BE_image | Booklet_expr.BE_bold | Booklet_expr.BE_italic | Booklet_expr.BE_title | Booklet_expr.BE_subtitle | Booklet_expr.BE_subtitle2 | Booklet_expr.BE_font | Booklet_expr.BE_color | Booklet_expr.BE_background | Booklet_expr.BE_columns | Booklet_expr.BE_fixed | Booklet_expr.BE_row | Booklet_expr.BE_column | Booklet_expr.BE_stack | Booklet_expr.BE_table | Booklet_expr.BE_class;

export namespace Booklet_expr {
 export const tag = 20;

 export const enum $Tags {
   BE_text = 0,
    BE_image = 1,
    BE_bold = 2,
    BE_italic = 3,
    BE_title = 4,
    BE_subtitle = 5,
    BE_subtitle2 = 6,
    BE_font = 7,
    BE_color = 8,
    BE_background = 9,
    BE_columns = 10,
    BE_fixed = 11,
    BE_row = 12,
    BE_column = 13,
    BE_stack = 14,
    BE_table = 15,
    BE_class = 16
 }

 
 export function BE_text(x: {readonly 'value': string}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_text,
     '@variant-name': 'BE-text',
     ...x
   }
 }

 export interface BE_text {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_text;
   readonly '@variant-name': 'BE-text';
   readonly 'value': string
 }


  
 export function BE_image(x: {readonly 'path': string}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_image,
     '@variant-name': 'BE-image',
     ...x
   }
 }

 export interface BE_image {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_image;
   readonly '@variant-name': 'BE-image';
   readonly 'path': string
 }


  
 export function BE_bold(x: {readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_bold,
     '@variant-name': 'BE-bold',
     ...x
   }
 }

 export interface BE_bold {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_bold;
   readonly '@variant-name': 'BE-bold';
   readonly 'value': Booklet_expr
 }


  
 export function BE_italic(x: {readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_italic,
     '@variant-name': 'BE-italic',
     ...x
   }
 }

 export interface BE_italic {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_italic;
   readonly '@variant-name': 'BE-italic';
   readonly 'value': Booklet_expr
 }


  
 export function BE_title(x: {readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_title,
     '@variant-name': 'BE-title',
     ...x
   }
 }

 export interface BE_title {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_title;
   readonly '@variant-name': 'BE-title';
   readonly 'value': Booklet_expr
 }


  
 export function BE_subtitle(x: {readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_subtitle,
     '@variant-name': 'BE-subtitle',
     ...x
   }
 }

 export interface BE_subtitle {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_subtitle;
   readonly '@variant-name': 'BE-subtitle';
   readonly 'value': Booklet_expr
 }


  
 export function BE_subtitle2(x: {readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_subtitle2,
     '@variant-name': 'BE-subtitle2',
     ...x
   }
 }

 export interface BE_subtitle2 {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_subtitle2;
   readonly '@variant-name': 'BE-subtitle2';
   readonly 'value': Booklet_expr
 }


  
 export function BE_font(x: {readonly 'family': string,readonly 'size': UInt32,readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_font,
     '@variant-name': 'BE-font',
     ...x
   }
 }

 export interface BE_font {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_font;
   readonly '@variant-name': 'BE-font';
   readonly 'family': string
    readonly 'size': UInt32
    readonly 'value': Booklet_expr
 }


  
 export function BE_color(x: {readonly 'r': UInt8,readonly 'g': UInt8,readonly 'b': UInt8,readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_color,
     '@variant-name': 'BE-color',
     ...x
   }
 }

 export interface BE_color {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_color;
   readonly '@variant-name': 'BE-color';
   readonly 'r': UInt8
    readonly 'g': UInt8
    readonly 'b': UInt8
    readonly 'value': Booklet_expr
 }


  
 export function BE_background(x: {readonly 'r': UInt8,readonly 'g': UInt8,readonly 'b': UInt8,readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_background,
     '@variant-name': 'BE-background',
     ...x
   }
 }

 export interface BE_background {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_background;
   readonly '@variant-name': 'BE-background';
   readonly 'r': UInt8
    readonly 'g': UInt8
    readonly 'b': UInt8
    readonly 'value': Booklet_expr
 }


  
 export function BE_columns(x: {readonly 'columns': UInt8,readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_columns,
     '@variant-name': 'BE-columns',
     ...x
   }
 }

 export interface BE_columns {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_columns;
   readonly '@variant-name': 'BE-columns';
   readonly 'columns': UInt8
    readonly 'value': Booklet_expr
 }


  
 export function BE_fixed(x: {readonly 'x': UInt32,readonly 'y': UInt32,readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_fixed,
     '@variant-name': 'BE-fixed',
     ...x
   }
 }

 export interface BE_fixed {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_fixed;
   readonly '@variant-name': 'BE-fixed';
   readonly 'x': UInt32
    readonly 'y': UInt32
    readonly 'value': Booklet_expr
 }


  
 export function BE_row(x: {readonly 'gap': UInt32,readonly 'align': Booklet_align,readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_row,
     '@variant-name': 'BE-row',
     ...x
   }
 }

 export interface BE_row {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_row;
   readonly '@variant-name': 'BE-row';
   readonly 'gap': UInt32
    readonly 'align': Booklet_align
    readonly 'value': Booklet_expr
 }


  
 export function BE_column(x: {readonly 'gap': UInt32,readonly 'align': Booklet_align,readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_column,
     '@variant-name': 'BE-column',
     ...x
   }
 }

 export interface BE_column {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_column;
   readonly '@variant-name': 'BE-column';
   readonly 'gap': UInt32
    readonly 'align': Booklet_align
    readonly 'value': Booklet_expr
 }


  
 export function BE_stack(x: {readonly 'values': (Booklet_expr)[]}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_stack,
     '@variant-name': 'BE-stack',
     ...x
   }
 }

 export interface BE_stack {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_stack;
   readonly '@variant-name': 'BE-stack';
   readonly 'values': (Booklet_expr)[]
 }


  
 export function BE_table(x: {readonly 'headers': (Booklet_expr)[],readonly 'rows': Booklet_row}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_table,
     '@variant-name': 'BE-table',
     ...x
   }
 }

 export interface BE_table {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_table;
   readonly '@variant-name': 'BE-table';
   readonly 'headers': (Booklet_expr)[]
    readonly 'rows': Booklet_row
 }


  
 export function BE_class(x: {readonly 'name': string,readonly 'value': Booklet_expr}): Booklet_expr {
   return {
     '@name': 'Booklet-expr',
     '@tag': 20,
     '@version': 0,
     '@variant': $Tags.BE_class,
     '@variant-name': 'BE-class',
     ...x
   }
 }

 export interface BE_class {
   readonly '@name': 'Booklet-expr';
   readonly '@tag': 20;
   readonly '@version': 0;
   readonly '@variant': $Tags.BE_class;
   readonly '@variant-name': 'BE-class';
   readonly 'name': string
    readonly 'value': Booklet_expr
 }

}



export interface Booklet_row {
 readonly '@name': 'Booklet-row';
 readonly '@tag': 21;
 readonly '@version': 0;
 readonly 'row-span': UInt32;
  readonly 'cells': (Booklet_cell)[]
}

export function Booklet_row(x: {readonly 'row-span': UInt32,readonly 'cells': (Booklet_cell)[]}): Booklet_row {
 return {
   '@name': 'Booklet-row',
   '@tag': 21,
   '@version': 0,
   ...x
 };
}

Booklet_row.tag = 21;



export interface Booklet_cell {
 readonly '@name': 'Booklet-cell';
 readonly '@tag': 22;
 readonly '@version': 0;
 readonly 'cell-span': UInt32;
  readonly 'value': Booklet_expr
}

export function Booklet_cell(x: {readonly 'cell-span': UInt32,readonly 'value': Booklet_expr}): Booklet_cell {
 return {
   '@name': 'Booklet-cell',
   '@tag': 22,
   '@version': 0,
   ...x
 };
}

Booklet_cell.tag = 22;



export type Booklet_align = Booklet_align.Start | Booklet_align.Center | Booklet_align.End | Booklet_align.Justify | Booklet_align.Space_evenly;

export namespace Booklet_align {
 export const tag = 23;

 export const enum $Tags {
   Start = 0,
    Center = 1,
    End = 2,
    Justify = 3,
    Space_evenly = 4
 }

 
 export function Start(x: {}): Booklet_align {
   return {
     '@name': 'Booklet-align',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Start,
     '@variant-name': 'Start',
     ...x
   }
 }

 export interface Start {
   readonly '@name': 'Booklet-align';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Start;
   readonly '@variant-name': 'Start';
   
 }


  
 export function Center(x: {}): Booklet_align {
   return {
     '@name': 'Booklet-align',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Center,
     '@variant-name': 'Center',
     ...x
   }
 }

 export interface Center {
   readonly '@name': 'Booklet-align';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Center;
   readonly '@variant-name': 'Center';
   
 }


  
 export function End(x: {}): Booklet_align {
   return {
     '@name': 'Booklet-align',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.End,
     '@variant-name': 'End',
     ...x
   }
 }

 export interface End {
   readonly '@name': 'Booklet-align';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.End;
   readonly '@variant-name': 'End';
   
 }


  
 export function Justify(x: {}): Booklet_align {
   return {
     '@name': 'Booklet-align',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Justify,
     '@variant-name': 'Justify',
     ...x
   }
 }

 export interface Justify {
   readonly '@name': 'Booklet-align';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Justify;
   readonly '@variant-name': 'Justify';
   
 }


  
 export function Space_evenly(x: {}): Booklet_align {
   return {
     '@name': 'Booklet-align',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Space_evenly,
     '@variant-name': 'Space-evenly',
     ...x
   }
 }

 export interface Space_evenly {
   readonly '@name': 'Booklet-align';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Space_evenly;
   readonly '@variant-name': 'Space-evenly';
   
 }

}



export type Platform = Platform.Web_archive;

export namespace Platform {
 export const tag = 24;

 export const enum $Tags {
   Web_archive = 0
 }

 
 export function Web_archive(x: {readonly 'html': string,readonly 'bridges': (Bridge)[]}): Platform {
   return {
     '@name': 'Platform',
     '@tag': 24,
     '@version': 0,
     '@variant': $Tags.Web_archive,
     '@variant-name': 'Web-archive',
     ...x
   }
 }

 export interface Web_archive {
   readonly '@name': 'Platform';
   readonly '@tag': 24;
   readonly '@version': 0;
   readonly '@variant': $Tags.Web_archive;
   readonly '@variant-name': 'Web-archive';
   readonly 'html': string
    readonly 'bridges': (Bridge)[]
 }

}



export type Bridge = Bridge.Network_proxy | Bridge.Local_storage_proxy | Bridge.Input_proxy | Bridge.Preserve_webgl_render | Bridge.Capture_canvas | Bridge.Pointer_input_proxy | Bridge.IndexedDB_proxy;

export namespace Bridge {
 export const tag = 25;

 export const enum $Tags {
   Network_proxy = 0,
    Local_storage_proxy = 1,
    Input_proxy = 2,
    Preserve_webgl_render = 3,
    Capture_canvas = 4,
    Pointer_input_proxy = 5,
    IndexedDB_proxy = 6
 }

 
 export function Network_proxy(x: {}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 25,
     '@version': 0,
     '@variant': $Tags.Network_proxy,
     '@variant-name': 'Network-proxy',
     ...x
   }
 }

 export interface Network_proxy {
   readonly '@name': 'Bridge';
   readonly '@tag': 25;
   readonly '@version': 0;
   readonly '@variant': $Tags.Network_proxy;
   readonly '@variant-name': 'Network-proxy';
   
 }


  
 export function Local_storage_proxy(x: {}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 25,
     '@version': 0,
     '@variant': $Tags.Local_storage_proxy,
     '@variant-name': 'Local-storage-proxy',
     ...x
   }
 }

 export interface Local_storage_proxy {
   readonly '@name': 'Bridge';
   readonly '@tag': 25;
   readonly '@version': 0;
   readonly '@variant': $Tags.Local_storage_proxy;
   readonly '@variant-name': 'Local-storage-proxy';
   
 }


  
 export function Input_proxy(x: {readonly 'mapping': Map<VirtualKey, KeyboardKey>}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 25,
     '@version': 0,
     '@variant': $Tags.Input_proxy,
     '@variant-name': 'Input-proxy',
     ...x
   }
 }

 export interface Input_proxy {
   readonly '@name': 'Bridge';
   readonly '@tag': 25;
   readonly '@version': 0;
   readonly '@variant': $Tags.Input_proxy;
   readonly '@variant-name': 'Input-proxy';
   readonly 'mapping': Map<VirtualKey, KeyboardKey>
 }


  
 export function Preserve_webgl_render(x: {}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 25,
     '@version': 0,
     '@variant': $Tags.Preserve_webgl_render,
     '@variant-name': 'Preserve-webgl-render',
     ...x
   }
 }

 export interface Preserve_webgl_render {
   readonly '@name': 'Bridge';
   readonly '@tag': 25;
   readonly '@version': 0;
   readonly '@variant': $Tags.Preserve_webgl_render;
   readonly '@variant-name': 'Preserve-webgl-render';
   
 }


  
 export function Capture_canvas(x: {readonly 'selector': string}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 25,
     '@version': 0,
     '@variant': $Tags.Capture_canvas,
     '@variant-name': 'Capture-canvas',
     ...x
   }
 }

 export interface Capture_canvas {
   readonly '@name': 'Bridge';
   readonly '@tag': 25;
   readonly '@version': 0;
   readonly '@variant': $Tags.Capture_canvas;
   readonly '@variant-name': 'Capture-canvas';
   readonly 'selector': string
 }


  
 export function Pointer_input_proxy(x: {readonly 'selector': string}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 25,
     '@version': 0,
     '@variant': $Tags.Pointer_input_proxy,
     '@variant-name': 'Pointer-input-proxy',
     ...x
   }
 }

 export interface Pointer_input_proxy {
   readonly '@name': 'Bridge';
   readonly '@tag': 25;
   readonly '@version': 0;
   readonly '@variant': $Tags.Pointer_input_proxy;
   readonly '@variant-name': 'Pointer-input-proxy';
   readonly 'selector': string
 }


  
 export function IndexedDB_proxy(x: {readonly 'versioned': boolean}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 25,
     '@version': 0,
     '@variant': $Tags.IndexedDB_proxy,
     '@variant-name': 'IndexedDB-proxy',
     ...x
   }
 }

 export interface IndexedDB_proxy {
   readonly '@name': 'Bridge';
   readonly '@tag': 25;
   readonly '@version': 0;
   readonly '@variant': $Tags.IndexedDB_proxy;
   readonly '@variant-name': 'IndexedDB-proxy';
   readonly 'versioned': boolean
 }

}



export type VirtualKey = VirtualKey.Up | VirtualKey.Right | VirtualKey.Down | VirtualKey.Left | VirtualKey.Menu | VirtualKey.Capture | VirtualKey.X | VirtualKey.O | VirtualKey.L_trigger | VirtualKey.R_trigger;

export namespace VirtualKey {
 export const tag = 26;

 export const enum $Tags {
   Up = 0,
    Right = 1,
    Down = 2,
    Left = 3,
    Menu = 4,
    Capture = 5,
    X = 6,
    O = 7,
    L_trigger = 8,
    R_trigger = 9
 }

 
 export function Up(x: {}): VirtualKey {
   return {
     '@name': 'VirtualKey',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Up,
     '@variant-name': 'Up',
     ...x
   }
 }

 export interface Up {
   readonly '@name': 'VirtualKey';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Up;
   readonly '@variant-name': 'Up';
   
 }


  
 export function Right(x: {}): VirtualKey {
   return {
     '@name': 'VirtualKey',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Right,
     '@variant-name': 'Right',
     ...x
   }
 }

 export interface Right {
   readonly '@name': 'VirtualKey';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Right;
   readonly '@variant-name': 'Right';
   
 }


  
 export function Down(x: {}): VirtualKey {
   return {
     '@name': 'VirtualKey',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Down,
     '@variant-name': 'Down',
     ...x
   }
 }

 export interface Down {
   readonly '@name': 'VirtualKey';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Down;
   readonly '@variant-name': 'Down';
   
 }


  
 export function Left(x: {}): VirtualKey {
   return {
     '@name': 'VirtualKey',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Left,
     '@variant-name': 'Left',
     ...x
   }
 }

 export interface Left {
   readonly '@name': 'VirtualKey';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Left;
   readonly '@variant-name': 'Left';
   
 }


  
 export function Menu(x: {}): VirtualKey {
   return {
     '@name': 'VirtualKey',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Menu,
     '@variant-name': 'Menu',
     ...x
   }
 }

 export interface Menu {
   readonly '@name': 'VirtualKey';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Menu;
   readonly '@variant-name': 'Menu';
   
 }


  
 export function Capture(x: {}): VirtualKey {
   return {
     '@name': 'VirtualKey',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Capture,
     '@variant-name': 'Capture',
     ...x
   }
 }

 export interface Capture {
   readonly '@name': 'VirtualKey';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Capture;
   readonly '@variant-name': 'Capture';
   
 }


  
 export function X(x: {}): VirtualKey {
   return {
     '@name': 'VirtualKey',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.X,
     '@variant-name': 'X',
     ...x
   }
 }

 export interface X {
   readonly '@name': 'VirtualKey';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.X;
   readonly '@variant-name': 'X';
   
 }


  
 export function O(x: {}): VirtualKey {
   return {
     '@name': 'VirtualKey',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.O,
     '@variant-name': 'O',
     ...x
   }
 }

 export interface O {
   readonly '@name': 'VirtualKey';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.O;
   readonly '@variant-name': 'O';
   
 }


  
 export function L_trigger(x: {}): VirtualKey {
   return {
     '@name': 'VirtualKey',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.L_trigger,
     '@variant-name': 'L-trigger',
     ...x
   }
 }

 export interface L_trigger {
   readonly '@name': 'VirtualKey';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.L_trigger;
   readonly '@variant-name': 'L-trigger';
   
 }


  
 export function R_trigger(x: {}): VirtualKey {
   return {
     '@name': 'VirtualKey',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.R_trigger,
     '@variant-name': 'R-trigger',
     ...x
   }
 }

 export interface R_trigger {
   readonly '@name': 'VirtualKey';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.R_trigger;
   readonly '@variant-name': 'R-trigger';
   
 }

}



export interface KeyboardKey {
 readonly '@name': 'KeyboardKey';
 readonly '@tag': 27;
 readonly '@version': 0;
 readonly 'key': string;
  readonly 'code': string;
  readonly 'key-code': UInt32
}

export function KeyboardKey(x: {readonly 'key': string,readonly 'code': string,readonly 'key-code': UInt32}): KeyboardKey {
 return {
   '@name': 'KeyboardKey',
   '@tag': 27,
   '@version': 0,
   ...x
 };
}

KeyboardKey.tag = 27;


