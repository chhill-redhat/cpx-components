export declare class CPXUser extends HTMLElement {
    _authenticated: boolean;
    _userId: string;
    get userId(): string;
    set userId(val: string);
    _givenname: string;
    get givenname(): string;
    set givenname(val: string);
    _email: string;
    get email(): string;
    set email(val: string);
    _eddl: boolean;
    get eddl(): boolean;
    set eddl(val: boolean);
    _ready: boolean;
    get ready(): boolean;
    set ready(val: boolean);
    _user: any;
    get user(): any;
    set user(val: any);
    constructor();
    connectedCallback(): void;
    static get observedAttributes(): string[];
    attributeChangedCallback(name: string, oldVal: string, newVal: string): void;
    generateHash(txt: any): Promise<string>;
    camelCase(str: String, to?: boolean): string;
    dispatchEDDL(): Promise<void>;
}
