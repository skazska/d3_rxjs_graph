import { Subject, Observer, Observable } from 'rxjs';
import { WebSocketSubject, WebSocketSubjectConfig } from 'rxjs/observable/dom/WebSocketSubject';

/// we inherit from the ordinary Subject
export class RcWebsocketSubject extends Subject {
    constructor(url, reconnectInterval, reconnectAttempts, resultSelector, serializer) {
        super();

        this.reconnectInterval = reconnectInterval || 5000;
        this.reconnectAttempts = reconnectAttempts || 10;
        this.resultSelector = resultSelector || ( e => { return JSON.parse(e.data); } );
        this.serializer = serializer || ( data => { return JSON.stringify(data); } );
        this.events = {};

        /// connection status
        this.connectionStatus = new Observable((observer) => {
            this.connectionObserver = observer;
        }).share().distinctUntilChanged();

        /// config for WebSocketSubject
        /// except the url, here is closeObserver and openObserver to update connection status
        this.wsSubjectConfig = {
            url: url,
            closeObserver: {
                next: e => {
                    this.socket = null;
                    this.connectionObserver.next(false);
                }
            },
            openObserver: {
                next: e => {
                    this.connectionObserver.next(true);
                }
            }
        };
        /// we connect
        this.connect();
        /// we follow the connection status and run the reconnect while losing the connection
        this.connectionStatus.subscribe((isConnected) => {
            if (!this.reconnectionObservable && typeof(isConnected) == "boolean" && !isConnected) {
                this.reconnect();
            }
        });
    }

    connect() {
        this.socket = new WebSocketSubject(this.wsSubjectConfig);
        this.socket.subscribe(
            m => {
                this.next(m);
            },
            error => {
                if (!this.socket) {
                    /// in case of an error with a loss of connection, we restore it
                    this.reconnect();
                }
            }
        );
    }

    /// reconnection
    reconnect() {
        this.reconnectionObservable = Observable.interval(this.reconnectInterval)
            .takeWhile((v, index) => {
                return index < this.reconnectAttempts && !this.socket
            });
        this.reconnectionObservable.subscribe(
            () => {
                this.connect();
            },
            null,
            () => {
                /// if the reconnection attempts are failed, then we call complete of our Subject and status
                this.reconnectionObservable = null;
                if (!this.socket) {
                    this.complete();
                    this.connectionObserver.complete();
                }
            }
        );
    }

    /// sending the message
    send(data) {
        this.socket.next(this.serializer(data));
    }
}