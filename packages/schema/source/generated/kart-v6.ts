// This file was generated from a LJT schema.
export type Int8 = number;
export type Int16 = number;
export type Int32 = number;
export type Int64 = bigint;
export type UInt8 = number;
export type UInt16 = number;
export type UInt32 = number;
export type UInt64 = bigint;
export type Float32 = number;
export type Float64 = number;


export type Runtime = Runtime.Web_archive;

export namespace Runtime {
 export const tag = 8;

 export const enum $Tags {
   Web_archive = 0
 }

 
 export function Web_archive(x: {readonly 'html-path': string,readonly 'bridges': (Bridge)[]}): Runtime {
   return {
     '@name': 'Runtime',
     '@tag': 8,
     '@version': 0,
     '@variant': $Tags.Web_archive,
     '@variant-name': 'Web-archive',
     ...x
   }
 }

 export interface Web_archive {
   readonly '@name': 'Runtime';
   readonly '@tag': 8;
   readonly '@version': 0;
   readonly '@variant': $Tags.Web_archive;
   readonly '@variant-name': 'Web-archive';
   readonly 'html-path': string
    readonly 'bridges': (Bridge)[]
 }

}



export interface Header {
 readonly '@name': 'Header';
 readonly '@tag': 0;
 readonly '@version': 0;
 readonly 'minimum-kate-version': Kate_version;
  readonly 'metadata-location': Binary_location;
  readonly 'content-location': Binary_location
}

export function Header(x: {readonly 'minimum-kate-version': Kate_version,readonly 'metadata-location': Binary_location,readonly 'content-location': Binary_location}): Header {
 return {
   '@name': 'Header',
   '@tag': 0,
   '@version': 0,
   ...x
 };
}

Header.tag = 0;



export interface Metadata {
 readonly '@name': 'Metadata';
 readonly '@tag': 1;
 readonly '@version': 0;
 readonly 'identification': Meta_identification;
  readonly 'presentation': Meta_presentation;
  readonly 'classification': Meta_classification;
  readonly 'legal': Meta_legal;
  readonly 'accessibility': Meta_accessibility;
  readonly 'security': Security;
  readonly 'runtime': Runtime;
  readonly 'files': (Meta_file)[];
  readonly 'signature': (Signature)[]
}

export function Metadata(x: {readonly 'identification': Meta_identification,readonly 'presentation': Meta_presentation,readonly 'classification': Meta_classification,readonly 'legal': Meta_legal,readonly 'accessibility': Meta_accessibility,readonly 'security': Security,readonly 'runtime': Runtime,readonly 'files': (Meta_file)[],readonly 'signature': (Signature)[]}): Metadata {
 return {
   '@name': 'Metadata',
   '@tag': 1,
   '@version': 0,
   ...x
 };
}

Metadata.tag = 1;



export interface Meta_identification {
 readonly '@name': 'Meta-identification';
 readonly '@tag': 2;
 readonly '@version': 0;
 readonly 'id': string;
  readonly 'version': Version;
  readonly 'release-date': Date
}

export function Meta_identification(x: {readonly 'id': string,readonly 'version': Version,readonly 'release-date': Date}): Meta_identification {
 return {
   '@name': 'Meta-identification',
   '@tag': 2,
   '@version': 0,
   ...x
 };
}

Meta_identification.tag = 2;



export interface Meta_presentation {
 readonly '@name': 'Meta-presentation';
 readonly '@tag': 3;
 readonly '@version': 0;
 readonly 'title': string;
  readonly 'author': string;
  readonly 'tagline': string;
  readonly 'description': string;
  readonly 'release-type': Release_type;
  readonly 'thumbnail-path': (string) | null;
  readonly 'banner-path': (string) | null
}

export function Meta_presentation(x: {readonly 'title': string,readonly 'author': string,readonly 'tagline': string,readonly 'description': string,readonly 'release-type': Release_type,readonly 'thumbnail-path': (string) | null,readonly 'banner-path': (string) | null}): Meta_presentation {
 return {
   '@name': 'Meta-presentation',
   '@tag': 3,
   '@version': 0,
   ...x
 };
}

Meta_presentation.tag = 3;



export interface Meta_classification {
 readonly '@name': 'Meta-classification';
 readonly '@tag': 4;
 readonly '@version': 0;
 readonly 'genre': (Genre)[];
  readonly 'tags': (string)[];
  readonly 'rating': Content_rating;
  readonly 'warnings': (string) | null
}

export function Meta_classification(x: {readonly 'genre': (Genre)[],readonly 'tags': (string)[],readonly 'rating': Content_rating,readonly 'warnings': (string) | null}): Meta_classification {
 return {
   '@name': 'Meta-classification',
   '@tag': 4,
   '@version': 0,
   ...x
 };
}

Meta_classification.tag = 4;



export interface Meta_legal {
 readonly '@name': 'Meta-legal';
 readonly '@tag': 5;
 readonly '@version': 0;
 readonly 'derivative-policy': Derivative_policy;
  readonly 'licence-path': (string) | null;
  readonly 'privacy-policy-path': (string) | null
}

export function Meta_legal(x: {readonly 'derivative-policy': Derivative_policy,readonly 'licence-path': (string) | null,readonly 'privacy-policy-path': (string) | null}): Meta_legal {
 return {
   '@name': 'Meta-legal',
   '@tag': 5,
   '@version': 0,
   ...x
 };
}

Meta_legal.tag = 5;



export interface Meta_accessibility {
 readonly '@name': 'Meta-accessibility';
 readonly '@tag': 6;
 readonly '@version': 0;
 readonly 'input-methods': (Input_method)[];
  readonly 'languages': (Language)[];
  readonly 'provisions': (Accessibility_provision)[];
  readonly 'average-completion-seconds': (UInt32) | null;
  readonly 'average-session-seconds': (UInt32) | null
}

export function Meta_accessibility(x: {readonly 'input-methods': (Input_method)[],readonly 'languages': (Language)[],readonly 'provisions': (Accessibility_provision)[],readonly 'average-completion-seconds': (UInt32) | null,readonly 'average-session-seconds': (UInt32) | null}): Meta_accessibility {
 return {
   '@name': 'Meta-accessibility',
   '@tag': 6,
   '@version': 0,
   ...x
 };
}

Meta_accessibility.tag = 6;



export interface Security {
 readonly '@name': 'Security';
 readonly '@tag': 7;
 readonly '@version': 0;
 readonly 'capabilities': (Capability)[]
}

export function Security(x: {readonly 'capabilities': (Capability)[]}): Security {
 return {
   '@name': 'Security',
   '@tag': 7,
   '@version': 0,
   ...x
 };
}

Security.tag = 7;



export interface Meta_file {
 readonly '@name': 'Meta-file';
 readonly '@tag': 9;
 readonly '@version': 0;
 readonly 'path': string;
  readonly 'mime': string;
  readonly 'integrity': Uint8Array;
  readonly 'hash-algorithm': Hash_algorithm;
  readonly 'offset': UInt64;
  readonly 'size': UInt32
}

export function Meta_file(x: {readonly 'path': string,readonly 'mime': string,readonly 'integrity': Uint8Array,readonly 'hash-algorithm': Hash_algorithm,readonly 'offset': UInt64,readonly 'size': UInt32}): Meta_file {
 return {
   '@name': 'Meta-file',
   '@tag': 9,
   '@version': 0,
   ...x
 };
}

Meta_file.tag = 9;



export interface Signature {
 readonly '@name': 'Signature';
 readonly '@tag': 10;
 readonly '@version': 0;
 readonly 'signed-by': string;
  readonly 'key-id': string;
  readonly 'signature': Uint8Array
}

export function Signature(x: {readonly 'signed-by': string,readonly 'key-id': string,readonly 'signature': Uint8Array}): Signature {
 return {
   '@name': 'Signature',
   '@tag': 10,
   '@version': 0,
   ...x
 };
}

Signature.tag = 10;



export interface Version {
 readonly '@name': 'Version';
 readonly '@tag': 11;
 readonly '@version': 0;
 readonly 'major': UInt32;
  readonly 'minor': UInt32
}

export function Version(x: {readonly 'major': UInt32,readonly 'minor': UInt32}): Version {
 return {
   '@name': 'Version',
   '@tag': 11,
   '@version': 0,
   ...x
 };
}

Version.tag = 11;



export interface Kate_version {
 readonly '@name': 'Kate-version';
 readonly '@tag': 12;
 readonly '@version': 0;
 readonly 'major': UInt32;
  readonly 'minor': UInt32;
  readonly 'patch': UInt32
}

export function Kate_version(x: {readonly 'major': UInt32,readonly 'minor': UInt32,readonly 'patch': UInt32}): Kate_version {
 return {
   '@name': 'Kate-version',
   '@tag': 12,
   '@version': 0,
   ...x
 };
}

Kate_version.tag = 12;



export interface Binary_location {
 readonly '@name': 'Binary-location';
 readonly '@tag': 13;
 readonly '@version': 0;
 readonly 'offset': UInt64;
  readonly 'size': UInt64
}

export function Binary_location(x: {readonly 'offset': UInt64,readonly 'size': UInt64}): Binary_location {
 return {
   '@name': 'Binary-location',
   '@tag': 13,
   '@version': 0,
   ...x
 };
}

Binary_location.tag = 13;



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



export type Genre = Genre.Not_specified | Genre.Action | Genre.Platformer | Genre.Shooter | Genre.Racing | Genre.Fighting | Genre.Rhythm | Genre.Adventure | Genre.Interactive_fiction | Genre.Visual_novel | Genre.Puzzle | Genre.RPG | Genre.Simulation | Genre.Strategy | Genre.Sports | Genre.Tool | Genre.Other;

export namespace Genre {
 export const tag = 15;

 export const enum $Tags {
   Not_specified = 0,
    Action = 1,
    Platformer = 2,
    Shooter = 3,
    Racing = 4,
    Fighting = 5,
    Rhythm = 6,
    Adventure = 7,
    Interactive_fiction = 8,
    Visual_novel = 9,
    Puzzle = 10,
    RPG = 11,
    Simulation = 12,
    Strategy = 13,
    Sports = 14,
    Tool = 15,
    Other = 16
 }

 
 export function Not_specified(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Not_specified,
     '@variant-name': 'Not-specified',
     ...x
   }
 }

 export interface Not_specified {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Not_specified;
   readonly '@variant-name': 'Not-specified';
   
 }


  
 export function Action(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Action,
     '@variant-name': 'Action',
     ...x
   }
 }

 export interface Action {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Action;
   readonly '@variant-name': 'Action';
   
 }


  
 export function Platformer(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Platformer,
     '@variant-name': 'Platformer',
     ...x
   }
 }

 export interface Platformer {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Platformer;
   readonly '@variant-name': 'Platformer';
   
 }


  
 export function Shooter(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Shooter,
     '@variant-name': 'Shooter',
     ...x
   }
 }

 export interface Shooter {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Shooter;
   readonly '@variant-name': 'Shooter';
   
 }


  
 export function Racing(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Racing,
     '@variant-name': 'Racing',
     ...x
   }
 }

 export interface Racing {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Racing;
   readonly '@variant-name': 'Racing';
   
 }


  
 export function Fighting(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Fighting,
     '@variant-name': 'Fighting',
     ...x
   }
 }

 export interface Fighting {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Fighting;
   readonly '@variant-name': 'Fighting';
   
 }


  
 export function Rhythm(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Rhythm,
     '@variant-name': 'Rhythm',
     ...x
   }
 }

 export interface Rhythm {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Rhythm;
   readonly '@variant-name': 'Rhythm';
   
 }


  
 export function Adventure(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Adventure,
     '@variant-name': 'Adventure',
     ...x
   }
 }

 export interface Adventure {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Adventure;
   readonly '@variant-name': 'Adventure';
   
 }


  
 export function Interactive_fiction(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Interactive_fiction,
     '@variant-name': 'Interactive-fiction',
     ...x
   }
 }

 export interface Interactive_fiction {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Interactive_fiction;
   readonly '@variant-name': 'Interactive-fiction';
   
 }


  
 export function Visual_novel(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Visual_novel,
     '@variant-name': 'Visual-novel',
     ...x
   }
 }

 export interface Visual_novel {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Visual_novel;
   readonly '@variant-name': 'Visual-novel';
   
 }


  
 export function Puzzle(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Puzzle,
     '@variant-name': 'Puzzle',
     ...x
   }
 }

 export interface Puzzle {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Puzzle;
   readonly '@variant-name': 'Puzzle';
   
 }


  
 export function RPG(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.RPG,
     '@variant-name': 'RPG',
     ...x
   }
 }

 export interface RPG {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.RPG;
   readonly '@variant-name': 'RPG';
   
 }


  
 export function Simulation(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Simulation,
     '@variant-name': 'Simulation',
     ...x
   }
 }

 export interface Simulation {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Simulation;
   readonly '@variant-name': 'Simulation';
   
 }


  
 export function Strategy(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Strategy,
     '@variant-name': 'Strategy',
     ...x
   }
 }

 export interface Strategy {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Strategy;
   readonly '@variant-name': 'Strategy';
   
 }


  
 export function Sports(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Sports,
     '@variant-name': 'Sports',
     ...x
   }
 }

 export interface Sports {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Sports;
   readonly '@variant-name': 'Sports';
   
 }


  
 export function Tool(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Tool,
     '@variant-name': 'Tool',
     ...x
   }
 }

 export interface Tool {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Tool;
   readonly '@variant-name': 'Tool';
   
 }


  
 export function Other(x: {}): Genre {
   return {
     '@name': 'Genre',
     '@tag': 15,
     '@version': 0,
     '@variant': $Tags.Other,
     '@variant-name': 'Other',
     ...x
   }
 }

 export interface Other {
   readonly '@name': 'Genre';
   readonly '@tag': 15;
   readonly '@version': 0;
   readonly '@variant': $Tags.Other;
   readonly '@variant-name': 'Other';
   
 }

}



export type Content_rating = Content_rating.General | Content_rating.Teen_and_up | Content_rating.Mature | Content_rating.Explicit | Content_rating.Unknown;

export namespace Content_rating {
 export const tag = 16;

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
     '@tag': 16,
     '@version': 0,
     '@variant': $Tags.General,
     '@variant-name': 'General',
     ...x
   }
 }

 export interface General {
   readonly '@name': 'Content-rating';
   readonly '@tag': 16;
   readonly '@version': 0;
   readonly '@variant': $Tags.General;
   readonly '@variant-name': 'General';
   
 }


  
 export function Teen_and_up(x: {}): Content_rating {
   return {
     '@name': 'Content-rating',
     '@tag': 16,
     '@version': 0,
     '@variant': $Tags.Teen_and_up,
     '@variant-name': 'Teen-and-up',
     ...x
   }
 }

 export interface Teen_and_up {
   readonly '@name': 'Content-rating';
   readonly '@tag': 16;
   readonly '@version': 0;
   readonly '@variant': $Tags.Teen_and_up;
   readonly '@variant-name': 'Teen-and-up';
   
 }


  
 export function Mature(x: {}): Content_rating {
   return {
     '@name': 'Content-rating',
     '@tag': 16,
     '@version': 0,
     '@variant': $Tags.Mature,
     '@variant-name': 'Mature',
     ...x
   }
 }

 export interface Mature {
   readonly '@name': 'Content-rating';
   readonly '@tag': 16;
   readonly '@version': 0;
   readonly '@variant': $Tags.Mature;
   readonly '@variant-name': 'Mature';
   
 }


  
 export function Explicit(x: {}): Content_rating {
   return {
     '@name': 'Content-rating',
     '@tag': 16,
     '@version': 0,
     '@variant': $Tags.Explicit,
     '@variant-name': 'Explicit',
     ...x
   }
 }

 export interface Explicit {
   readonly '@name': 'Content-rating';
   readonly '@tag': 16;
   readonly '@version': 0;
   readonly '@variant': $Tags.Explicit;
   readonly '@variant-name': 'Explicit';
   
 }


  
 export function Unknown(x: {}): Content_rating {
   return {
     '@name': 'Content-rating',
     '@tag': 16,
     '@version': 0,
     '@variant': $Tags.Unknown,
     '@variant-name': 'Unknown',
     ...x
   }
 }

 export interface Unknown {
   readonly '@name': 'Content-rating';
   readonly '@tag': 16;
   readonly '@version': 0;
   readonly '@variant': $Tags.Unknown;
   readonly '@variant-name': 'Unknown';
   
 }

}



export type Release_type = Release_type.Prototype | Release_type.Early_access | Release_type.Beta | Release_type.Demo | Release_type.Regular | Release_type.Unofficial;

export namespace Release_type {
 export const tag = 17;

 export const enum $Tags {
   Prototype = 0,
    Early_access = 1,
    Beta = 2,
    Demo = 3,
    Regular = 4,
    Unofficial = 5
 }

 
 export function Prototype(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 17,
     '@version': 0,
     '@variant': $Tags.Prototype,
     '@variant-name': 'Prototype',
     ...x
   }
 }

 export interface Prototype {
   readonly '@name': 'Release-type';
   readonly '@tag': 17;
   readonly '@version': 0;
   readonly '@variant': $Tags.Prototype;
   readonly '@variant-name': 'Prototype';
   
 }


  
 export function Early_access(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 17,
     '@version': 0,
     '@variant': $Tags.Early_access,
     '@variant-name': 'Early-access',
     ...x
   }
 }

 export interface Early_access {
   readonly '@name': 'Release-type';
   readonly '@tag': 17;
   readonly '@version': 0;
   readonly '@variant': $Tags.Early_access;
   readonly '@variant-name': 'Early-access';
   
 }


  
 export function Beta(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 17,
     '@version': 0,
     '@variant': $Tags.Beta,
     '@variant-name': 'Beta',
     ...x
   }
 }

 export interface Beta {
   readonly '@name': 'Release-type';
   readonly '@tag': 17;
   readonly '@version': 0;
   readonly '@variant': $Tags.Beta;
   readonly '@variant-name': 'Beta';
   
 }


  
 export function Demo(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 17,
     '@version': 0,
     '@variant': $Tags.Demo,
     '@variant-name': 'Demo',
     ...x
   }
 }

 export interface Demo {
   readonly '@name': 'Release-type';
   readonly '@tag': 17;
   readonly '@version': 0;
   readonly '@variant': $Tags.Demo;
   readonly '@variant-name': 'Demo';
   
 }


  
 export function Regular(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 17,
     '@version': 0,
     '@variant': $Tags.Regular,
     '@variant-name': 'Regular',
     ...x
   }
 }

 export interface Regular {
   readonly '@name': 'Release-type';
   readonly '@tag': 17;
   readonly '@version': 0;
   readonly '@variant': $Tags.Regular;
   readonly '@variant-name': 'Regular';
   
 }


  
 export function Unofficial(x: {}): Release_type {
   return {
     '@name': 'Release-type',
     '@tag': 17,
     '@version': 0,
     '@variant': $Tags.Unofficial,
     '@variant-name': 'Unofficial',
     ...x
   }
 }

 export interface Unofficial {
   readonly '@name': 'Release-type';
   readonly '@tag': 17;
   readonly '@version': 0;
   readonly '@variant': $Tags.Unofficial;
   readonly '@variant-name': 'Unofficial';
   
 }

}



export type Derivative_policy = Derivative_policy.Not_allowed | Derivative_policy.Personal_use | Derivative_policy.Non_commercial_use | Derivative_policy.Commercial_use;

export namespace Derivative_policy {
 export const tag = 18;

 export const enum $Tags {
   Not_allowed = 0,
    Personal_use = 1,
    Non_commercial_use = 2,
    Commercial_use = 3
 }

 
 export function Not_allowed(x: {}): Derivative_policy {
   return {
     '@name': 'Derivative-policy',
     '@tag': 18,
     '@version': 0,
     '@variant': $Tags.Not_allowed,
     '@variant-name': 'Not-allowed',
     ...x
   }
 }

 export interface Not_allowed {
   readonly '@name': 'Derivative-policy';
   readonly '@tag': 18;
   readonly '@version': 0;
   readonly '@variant': $Tags.Not_allowed;
   readonly '@variant-name': 'Not-allowed';
   
 }


  
 export function Personal_use(x: {}): Derivative_policy {
   return {
     '@name': 'Derivative-policy',
     '@tag': 18,
     '@version': 0,
     '@variant': $Tags.Personal_use,
     '@variant-name': 'Personal-use',
     ...x
   }
 }

 export interface Personal_use {
   readonly '@name': 'Derivative-policy';
   readonly '@tag': 18;
   readonly '@version': 0;
   readonly '@variant': $Tags.Personal_use;
   readonly '@variant-name': 'Personal-use';
   
 }


  
 export function Non_commercial_use(x: {}): Derivative_policy {
   return {
     '@name': 'Derivative-policy',
     '@tag': 18,
     '@version': 0,
     '@variant': $Tags.Non_commercial_use,
     '@variant-name': 'Non-commercial-use',
     ...x
   }
 }

 export interface Non_commercial_use {
   readonly '@name': 'Derivative-policy';
   readonly '@tag': 18;
   readonly '@version': 0;
   readonly '@variant': $Tags.Non_commercial_use;
   readonly '@variant-name': 'Non-commercial-use';
   
 }


  
 export function Commercial_use(x: {}): Derivative_policy {
   return {
     '@name': 'Derivative-policy',
     '@tag': 18,
     '@version': 0,
     '@variant': $Tags.Commercial_use,
     '@variant-name': 'Commercial-use',
     ...x
   }
 }

 export interface Commercial_use {
   readonly '@name': 'Derivative-policy';
   readonly '@tag': 18;
   readonly '@version': 0;
   readonly '@variant': $Tags.Commercial_use;
   readonly '@variant-name': 'Commercial-use';
   
 }

}



export type Input_method = Input_method.Buttons | Input_method.Pointer;

export namespace Input_method {
 export const tag = 19;

 export const enum $Tags {
   Buttons = 0,
    Pointer = 1
 }

 
 export function Buttons(x: {}): Input_method {
   return {
     '@name': 'Input-method',
     '@tag': 19,
     '@version': 0,
     '@variant': $Tags.Buttons,
     '@variant-name': 'Buttons',
     ...x
   }
 }

 export interface Buttons {
   readonly '@name': 'Input-method';
   readonly '@tag': 19;
   readonly '@version': 0;
   readonly '@variant': $Tags.Buttons;
   readonly '@variant-name': 'Buttons';
   
 }


  
 export function Pointer(x: {}): Input_method {
   return {
     '@name': 'Input-method',
     '@tag': 19,
     '@version': 0,
     '@variant': $Tags.Pointer,
     '@variant-name': 'Pointer',
     ...x
   }
 }

 export interface Pointer {
   readonly '@name': 'Input-method';
   readonly '@tag': 19;
   readonly '@version': 0;
   readonly '@variant': $Tags.Pointer;
   readonly '@variant-name': 'Pointer';
   
 }

}



export interface Language {
 readonly '@name': 'Language';
 readonly '@tag': 20;
 readonly '@version': 0;
 readonly 'iso-code': string;
  readonly 'interface': boolean;
  readonly 'audio': boolean;
  readonly 'text': boolean
}

export function Language(x: {readonly 'iso-code': string,readonly 'interface': boolean,readonly 'audio': boolean,readonly 'text': boolean}): Language {
 return {
   '@name': 'Language',
   '@tag': 20,
   '@version': 0,
   ...x
 };
}

Language.tag = 20;



export type Accessibility_provision = Accessibility_provision.High_contrast | Accessibility_provision.Subtitles | Accessibility_provision.Image_captions | Accessibility_provision.Voiced_text | Accessibility_provision.Configurable_difficulty | Accessibility_provision.Skippable_content;

export namespace Accessibility_provision {
 export const tag = 21;

 export const enum $Tags {
   High_contrast = 0,
    Subtitles = 1,
    Image_captions = 2,
    Voiced_text = 3,
    Configurable_difficulty = 4,
    Skippable_content = 5
 }

 
 export function High_contrast(x: {}): Accessibility_provision {
   return {
     '@name': 'Accessibility-provision',
     '@tag': 21,
     '@version': 0,
     '@variant': $Tags.High_contrast,
     '@variant-name': 'High-contrast',
     ...x
   }
 }

 export interface High_contrast {
   readonly '@name': 'Accessibility-provision';
   readonly '@tag': 21;
   readonly '@version': 0;
   readonly '@variant': $Tags.High_contrast;
   readonly '@variant-name': 'High-contrast';
   
 }


  
 export function Subtitles(x: {}): Accessibility_provision {
   return {
     '@name': 'Accessibility-provision',
     '@tag': 21,
     '@version': 0,
     '@variant': $Tags.Subtitles,
     '@variant-name': 'Subtitles',
     ...x
   }
 }

 export interface Subtitles {
   readonly '@name': 'Accessibility-provision';
   readonly '@tag': 21;
   readonly '@version': 0;
   readonly '@variant': $Tags.Subtitles;
   readonly '@variant-name': 'Subtitles';
   
 }


  
 export function Image_captions(x: {}): Accessibility_provision {
   return {
     '@name': 'Accessibility-provision',
     '@tag': 21,
     '@version': 0,
     '@variant': $Tags.Image_captions,
     '@variant-name': 'Image-captions',
     ...x
   }
 }

 export interface Image_captions {
   readonly '@name': 'Accessibility-provision';
   readonly '@tag': 21;
   readonly '@version': 0;
   readonly '@variant': $Tags.Image_captions;
   readonly '@variant-name': 'Image-captions';
   
 }


  
 export function Voiced_text(x: {}): Accessibility_provision {
   return {
     '@name': 'Accessibility-provision',
     '@tag': 21,
     '@version': 0,
     '@variant': $Tags.Voiced_text,
     '@variant-name': 'Voiced-text',
     ...x
   }
 }

 export interface Voiced_text {
   readonly '@name': 'Accessibility-provision';
   readonly '@tag': 21;
   readonly '@version': 0;
   readonly '@variant': $Tags.Voiced_text;
   readonly '@variant-name': 'Voiced-text';
   
 }


  
 export function Configurable_difficulty(x: {}): Accessibility_provision {
   return {
     '@name': 'Accessibility-provision',
     '@tag': 21,
     '@version': 0,
     '@variant': $Tags.Configurable_difficulty,
     '@variant-name': 'Configurable-difficulty',
     ...x
   }
 }

 export interface Configurable_difficulty {
   readonly '@name': 'Accessibility-provision';
   readonly '@tag': 21;
   readonly '@version': 0;
   readonly '@variant': $Tags.Configurable_difficulty;
   readonly '@variant-name': 'Configurable-difficulty';
   
 }


  
 export function Skippable_content(x: {}): Accessibility_provision {
   return {
     '@name': 'Accessibility-provision',
     '@tag': 21,
     '@version': 0,
     '@variant': $Tags.Skippable_content,
     '@variant-name': 'Skippable-content',
     ...x
   }
 }

 export interface Skippable_content {
   readonly '@name': 'Accessibility-provision';
   readonly '@tag': 21;
   readonly '@version': 0;
   readonly '@variant': $Tags.Skippable_content;
   readonly '@variant-name': 'Skippable-content';
   
 }

}



export type Bridge = Bridge.Network_proxy | Bridge.Local_storage_proxy | Bridge.Input_proxy | Bridge.Preserve_WebGL_render | Bridge.Capture_canvas | Bridge.Pointer_input_proxy | Bridge.IndexedDB_proxy | Bridge.Renpy_web_tweaks | Bridge.External_URL_handler | Bridge.Keyboard_input_proxy_v2 | Bridge.Network_proxy_v2 | Bridge.Resize_canvas;

export namespace Bridge {
 export const tag = 22;

 export const enum $Tags {
   Network_proxy = 0,
    Local_storage_proxy = 1,
    Input_proxy = 2,
    Preserve_WebGL_render = 3,
    Capture_canvas = 4,
    Pointer_input_proxy = 5,
    IndexedDB_proxy = 6,
    Renpy_web_tweaks = 7,
    External_URL_handler = 8,
    Keyboard_input_proxy_v2 = 9,
    Network_proxy_v2 = 10,
    Resize_canvas = 11
 }

 
 export function Network_proxy(x: {}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.Network_proxy,
     '@variant-name': 'Network-proxy',
     ...x
   }
 }

 export interface Network_proxy {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.Network_proxy;
   readonly '@variant-name': 'Network-proxy';
   
 }


  
 export function Local_storage_proxy(x: {}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.Local_storage_proxy,
     '@variant-name': 'Local-storage-proxy',
     ...x
   }
 }

 export interface Local_storage_proxy {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.Local_storage_proxy;
   readonly '@variant-name': 'Local-storage-proxy';
   
 }


  
 export function Input_proxy(x: {readonly 'mapping': Map<Virtual_key, Keyboard_key>}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.Input_proxy,
     '@variant-name': 'Input-proxy',
     ...x
   }
 }

 export interface Input_proxy {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.Input_proxy;
   readonly '@variant-name': 'Input-proxy';
   readonly 'mapping': Map<Virtual_key, Keyboard_key>
 }


  
 export function Preserve_WebGL_render(x: {}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.Preserve_WebGL_render,
     '@variant-name': 'Preserve-WebGL-render',
     ...x
   }
 }

 export interface Preserve_WebGL_render {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.Preserve_WebGL_render;
   readonly '@variant-name': 'Preserve-WebGL-render';
   
 }


  
 export function Capture_canvas(x: {readonly 'selector': string}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.Capture_canvas,
     '@variant-name': 'Capture-canvas',
     ...x
   }
 }

 export interface Capture_canvas {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.Capture_canvas;
   readonly '@variant-name': 'Capture-canvas';
   readonly 'selector': string
 }


  
 export function Pointer_input_proxy(x: {readonly 'selector': string,readonly 'hide-cursor': boolean}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.Pointer_input_proxy,
     '@variant-name': 'Pointer-input-proxy',
     ...x
   }
 }

 export interface Pointer_input_proxy {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.Pointer_input_proxy;
   readonly '@variant-name': 'Pointer-input-proxy';
   readonly 'selector': string
    readonly 'hide-cursor': boolean
 }


  
 export function IndexedDB_proxy(x: {readonly 'versioned': boolean}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.IndexedDB_proxy,
     '@variant-name': 'IndexedDB-proxy',
     ...x
   }
 }

 export interface IndexedDB_proxy {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.IndexedDB_proxy;
   readonly '@variant-name': 'IndexedDB-proxy';
   readonly 'versioned': boolean
 }


  
 export function Renpy_web_tweaks(x: {readonly 'version': Version}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.Renpy_web_tweaks,
     '@variant-name': 'Renpy-web-tweaks',
     ...x
   }
 }

 export interface Renpy_web_tweaks {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.Renpy_web_tweaks;
   readonly '@variant-name': 'Renpy-web-tweaks';
   readonly 'version': Version
 }


  
 export function External_URL_handler(x: {}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.External_URL_handler,
     '@variant-name': 'External-URL-handler',
     ...x
   }
 }

 export interface External_URL_handler {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.External_URL_handler;
   readonly '@variant-name': 'External-URL-handler';
   
 }


  
 export function Keyboard_input_proxy_v2(x: {readonly 'mapping': Map<Virtual_key, Keyboard_key>,readonly 'selector': Keyboard_input_selector}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.Keyboard_input_proxy_v2,
     '@variant-name': 'Keyboard-input-proxy-v2',
     ...x
   }
 }

 export interface Keyboard_input_proxy_v2 {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.Keyboard_input_proxy_v2;
   readonly '@variant-name': 'Keyboard-input-proxy-v2';
   readonly 'mapping': Map<Virtual_key, Keyboard_key>
    readonly 'selector': Keyboard_input_selector
 }


  
 export function Network_proxy_v2(x: {readonly 'allow-sync-access': (string)[]}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.Network_proxy_v2,
     '@variant-name': 'Network-proxy-v2',
     ...x
   }
 }

 export interface Network_proxy_v2 {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.Network_proxy_v2;
   readonly '@variant-name': 'Network-proxy-v2';
   readonly 'allow-sync-access': (string)[]
 }


  
 export function Resize_canvas(x: {readonly 'selector': string}): Bridge {
   return {
     '@name': 'Bridge',
     '@tag': 22,
     '@version': 0,
     '@variant': $Tags.Resize_canvas,
     '@variant-name': 'Resize-canvas',
     ...x
   }
 }

 export interface Resize_canvas {
   readonly '@name': 'Bridge';
   readonly '@tag': 22;
   readonly '@version': 0;
   readonly '@variant': $Tags.Resize_canvas;
   readonly '@variant-name': 'Resize-canvas';
   readonly 'selector': string
 }

}



export type Virtual_key = Virtual_key.Up | Virtual_key.Right | Virtual_key.Down | Virtual_key.Left | Virtual_key.Menu | Virtual_key.Capture | Virtual_key.X | Virtual_key.O | Virtual_key.L_trigger | Virtual_key.R_trigger | Virtual_key.Berry | Virtual_key.Sparkle;

export namespace Virtual_key {
 export const tag = 23;

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
    R_trigger = 9,
    Berry = 10,
    Sparkle = 11
 }

 
 export function Up(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Up,
     '@variant-name': 'Up',
     ...x
   }
 }

 export interface Up {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Up;
   readonly '@variant-name': 'Up';
   
 }


  
 export function Right(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Right,
     '@variant-name': 'Right',
     ...x
   }
 }

 export interface Right {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Right;
   readonly '@variant-name': 'Right';
   
 }


  
 export function Down(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Down,
     '@variant-name': 'Down',
     ...x
   }
 }

 export interface Down {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Down;
   readonly '@variant-name': 'Down';
   
 }


  
 export function Left(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Left,
     '@variant-name': 'Left',
     ...x
   }
 }

 export interface Left {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Left;
   readonly '@variant-name': 'Left';
   
 }


  
 export function Menu(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Menu,
     '@variant-name': 'Menu',
     ...x
   }
 }

 export interface Menu {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Menu;
   readonly '@variant-name': 'Menu';
   
 }


  
 export function Capture(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Capture,
     '@variant-name': 'Capture',
     ...x
   }
 }

 export interface Capture {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Capture;
   readonly '@variant-name': 'Capture';
   
 }


  
 export function X(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.X,
     '@variant-name': 'X',
     ...x
   }
 }

 export interface X {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.X;
   readonly '@variant-name': 'X';
   
 }


  
 export function O(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.O,
     '@variant-name': 'O',
     ...x
   }
 }

 export interface O {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.O;
   readonly '@variant-name': 'O';
   
 }


  
 export function L_trigger(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.L_trigger,
     '@variant-name': 'L-trigger',
     ...x
   }
 }

 export interface L_trigger {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.L_trigger;
   readonly '@variant-name': 'L-trigger';
   
 }


  
 export function R_trigger(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.R_trigger,
     '@variant-name': 'R-trigger',
     ...x
   }
 }

 export interface R_trigger {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.R_trigger;
   readonly '@variant-name': 'R-trigger';
   
 }


  
 export function Berry(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Berry,
     '@variant-name': 'Berry',
     ...x
   }
 }

 export interface Berry {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Berry;
   readonly '@variant-name': 'Berry';
   
 }


  
 export function Sparkle(x: {}): Virtual_key {
   return {
     '@name': 'Virtual-key',
     '@tag': 23,
     '@version': 0,
     '@variant': $Tags.Sparkle,
     '@variant-name': 'Sparkle',
     ...x
   }
 }

 export interface Sparkle {
   readonly '@name': 'Virtual-key';
   readonly '@tag': 23;
   readonly '@version': 0;
   readonly '@variant': $Tags.Sparkle;
   readonly '@variant-name': 'Sparkle';
   
 }

}



export interface Keyboard_key {
 readonly '@name': 'Keyboard-key';
 readonly '@tag': 24;
 readonly '@version': 0;
 readonly 'code': string
}

export function Keyboard_key(x: {readonly 'code': string}): Keyboard_key {
 return {
   '@name': 'Keyboard-key',
   '@tag': 24,
   '@version': 0,
   ...x
 };
}

Keyboard_key.tag = 24;



export type Capability = Capability.Contextual | Capability.Passive;

export namespace Capability {
 export const tag = 25;

 export const enum $Tags {
   Contextual = 0,
    Passive = 1
 }

 
 export function Contextual(x: {readonly 'capability': Contextual_capability,readonly 'reason': string}): Capability {
   return {
     '@name': 'Capability',
     '@tag': 25,
     '@version': 0,
     '@variant': $Tags.Contextual,
     '@variant-name': 'Contextual',
     ...x
   }
 }

 export interface Contextual {
   readonly '@name': 'Capability';
   readonly '@tag': 25;
   readonly '@version': 0;
   readonly '@variant': $Tags.Contextual;
   readonly '@variant-name': 'Contextual';
   readonly 'capability': Contextual_capability
    readonly 'reason': string
 }


  
 export function Passive(x: {readonly 'capability': Passive_capability,readonly 'optional': boolean,readonly 'reason': string}): Capability {
   return {
     '@name': 'Capability',
     '@tag': 25,
     '@version': 0,
     '@variant': $Tags.Passive,
     '@variant-name': 'Passive',
     ...x
   }
 }

 export interface Passive {
   readonly '@name': 'Capability';
   readonly '@tag': 25;
   readonly '@version': 0;
   readonly '@variant': $Tags.Passive;
   readonly '@variant-name': 'Passive';
   readonly 'capability': Passive_capability
    readonly 'optional': boolean
    readonly 'reason': string
 }

}



export type Contextual_capability = Contextual_capability.Open_URLs | Contextual_capability.Request_device_files | Contextual_capability.Install_cartridges | Contextual_capability.Download_files | Contextual_capability.Show_dialogs | Contextual_capability.View_developer_profile | Contextual_capability.Sign_digitally;

export namespace Contextual_capability {
 export const tag = 26;

 export const enum $Tags {
   Open_URLs = 0,
    Request_device_files = 1,
    Install_cartridges = 2,
    Download_files = 3,
    Show_dialogs = 4,
    View_developer_profile = 5,
    Sign_digitally = 6
 }

 
 export function Open_URLs(x: {}): Contextual_capability {
   return {
     '@name': 'Contextual-capability',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Open_URLs,
     '@variant-name': 'Open-URLs',
     ...x
   }
 }

 export interface Open_URLs {
   readonly '@name': 'Contextual-capability';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Open_URLs;
   readonly '@variant-name': 'Open-URLs';
   
 }


  
 export function Request_device_files(x: {}): Contextual_capability {
   return {
     '@name': 'Contextual-capability',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Request_device_files,
     '@variant-name': 'Request-device-files',
     ...x
   }
 }

 export interface Request_device_files {
   readonly '@name': 'Contextual-capability';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Request_device_files;
   readonly '@variant-name': 'Request-device-files';
   
 }


  
 export function Install_cartridges(x: {}): Contextual_capability {
   return {
     '@name': 'Contextual-capability',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Install_cartridges,
     '@variant-name': 'Install-cartridges',
     ...x
   }
 }

 export interface Install_cartridges {
   readonly '@name': 'Contextual-capability';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Install_cartridges;
   readonly '@variant-name': 'Install-cartridges';
   
 }


  
 export function Download_files(x: {}): Contextual_capability {
   return {
     '@name': 'Contextual-capability',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Download_files,
     '@variant-name': 'Download-files',
     ...x
   }
 }

 export interface Download_files {
   readonly '@name': 'Contextual-capability';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Download_files;
   readonly '@variant-name': 'Download-files';
   
 }


  
 export function Show_dialogs(x: {}): Contextual_capability {
   return {
     '@name': 'Contextual-capability',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Show_dialogs,
     '@variant-name': 'Show-dialogs',
     ...x
   }
 }

 export interface Show_dialogs {
   readonly '@name': 'Contextual-capability';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Show_dialogs;
   readonly '@variant-name': 'Show-dialogs';
   
 }


  
 export function View_developer_profile(x: {}): Contextual_capability {
   return {
     '@name': 'Contextual-capability',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.View_developer_profile,
     '@variant-name': 'View-developer-profile',
     ...x
   }
 }

 export interface View_developer_profile {
   readonly '@name': 'Contextual-capability';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.View_developer_profile;
   readonly '@variant-name': 'View-developer-profile';
   
 }


  
 export function Sign_digitally(x: {}): Contextual_capability {
   return {
     '@name': 'Contextual-capability',
     '@tag': 26,
     '@version': 0,
     '@variant': $Tags.Sign_digitally,
     '@variant-name': 'Sign-digitally',
     ...x
   }
 }

 export interface Sign_digitally {
   readonly '@name': 'Contextual-capability';
   readonly '@tag': 26;
   readonly '@version': 0;
   readonly '@variant': $Tags.Sign_digitally;
   readonly '@variant-name': 'Sign-digitally';
   
 }

}



export type Passive_capability = Passive_capability.Store_temporary_files;

export namespace Passive_capability {
 export const tag = 27;

 export const enum $Tags {
   Store_temporary_files = 0
 }

 
 export function Store_temporary_files(x: {readonly 'max-size-mb': UInt32}): Passive_capability {
   return {
     '@name': 'Passive-capability',
     '@tag': 27,
     '@version': 0,
     '@variant': $Tags.Store_temporary_files,
     '@variant-name': 'Store-temporary-files',
     ...x
   }
 }

 export interface Store_temporary_files {
   readonly '@name': 'Passive-capability';
   readonly '@tag': 27;
   readonly '@version': 0;
   readonly '@variant': $Tags.Store_temporary_files;
   readonly '@variant-name': 'Store-temporary-files';
   readonly 'max-size-mb': UInt32
 }

}



export type Keyboard_input_selector = Keyboard_input_selector.Window | Keyboard_input_selector.Document | Keyboard_input_selector.Legacy | Keyboard_input_selector.CSS;

export namespace Keyboard_input_selector {
 export const tag = 28;

 export const enum $Tags {
   Window = 0,
    Document = 1,
    Legacy = 2,
    CSS = 3
 }

 
 export function Window(x: {}): Keyboard_input_selector {
   return {
     '@name': 'Keyboard-input-selector',
     '@tag': 28,
     '@version': 0,
     '@variant': $Tags.Window,
     '@variant-name': 'Window',
     ...x
   }
 }

 export interface Window {
   readonly '@name': 'Keyboard-input-selector';
   readonly '@tag': 28;
   readonly '@version': 0;
   readonly '@variant': $Tags.Window;
   readonly '@variant-name': 'Window';
   
 }


  
 export function Document(x: {}): Keyboard_input_selector {
   return {
     '@name': 'Keyboard-input-selector',
     '@tag': 28,
     '@version': 0,
     '@variant': $Tags.Document,
     '@variant-name': 'Document',
     ...x
   }
 }

 export interface Document {
   readonly '@name': 'Keyboard-input-selector';
   readonly '@tag': 28;
   readonly '@version': 0;
   readonly '@variant': $Tags.Document;
   readonly '@variant-name': 'Document';
   
 }


  
 export function Legacy(x: {}): Keyboard_input_selector {
   return {
     '@name': 'Keyboard-input-selector',
     '@tag': 28,
     '@version': 0,
     '@variant': $Tags.Legacy,
     '@variant-name': 'Legacy',
     ...x
   }
 }

 export interface Legacy {
   readonly '@name': 'Keyboard-input-selector';
   readonly '@tag': 28;
   readonly '@version': 0;
   readonly '@variant': $Tags.Legacy;
   readonly '@variant-name': 'Legacy';
   
 }


  
 export function CSS(x: {readonly 'selector': string}): Keyboard_input_selector {
   return {
     '@name': 'Keyboard-input-selector',
     '@tag': 28,
     '@version': 0,
     '@variant': $Tags.CSS,
     '@variant-name': 'CSS',
     ...x
   }
 }

 export interface CSS {
   readonly '@name': 'Keyboard-input-selector';
   readonly '@tag': 28;
   readonly '@version': 0;
   readonly '@variant': $Tags.CSS;
   readonly '@variant-name': 'CSS';
   readonly 'selector': string
 }

}



export type Hash_algorithm = Hash_algorithm.Sha_512;

export namespace Hash_algorithm {
 export const tag = 29;

 export const enum $Tags {
   Sha_512 = 0
 }

 
 export function Sha_512(x: {}): Hash_algorithm {
   return {
     '@name': 'Hash-algorithm',
     '@tag': 29,
     '@version': 0,
     '@variant': $Tags.Sha_512,
     '@variant-name': 'Sha-512',
     ...x
   }
 }

 export interface Sha_512 {
   readonly '@name': 'Hash-algorithm';
   readonly '@tag': 29;
   readonly '@version': 0;
   readonly '@variant': $Tags.Sha_512;
   readonly '@variant-name': 'Sha-512';
   
 }

}


