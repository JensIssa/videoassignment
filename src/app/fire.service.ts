import { Injectable } from '@angular/core';
import firebase from 'firebase/compat/app'
import 'firebase/compat/app'
import 'firebase/compat/firestore';
import 'firebase/compat/auth'
import 'firebase/compat/storage'

import * as config from '../../firebaseconfig.js'
@Injectable({
  providedIn: 'root'
})
export class FireService {

  firebaseApplication;
  firestore: firebase.firestore.Firestore;
  messages: any[] = [];
  auth: firebase.auth.Auth;
  storage: firebase.storage.Storage;
  currentlySignedInUserAvatarUrl: string = "https://i.pinimg.com/originals/a1/87/63/a187636bf41b53a885a204ed4cb89ffd.png";

  constructor() {
    this.firebaseApplication = firebase.initializeApp(config.firebaseConfig);
    this.firestore = firebase.firestore();
    this.auth = firebase.auth();
    this.storage = firebase.storage();

    this.auth.onAuthStateChanged((user) => {
      if (user){
        this.getMessages();
        this.getImageOfSignedInUser();
      }
    });
    this.getMessages();
  }

  async getImageOfSignedInUser() {
    this.currentlySignedInUserAvatarUrl =  await this.storage
      .ref('avatars')
      .child(this.auth.currentUser?.uid + '')
      .getDownloadURL();
  }

  async updateUserImage($event){
    const img = $event.target.files[0];
    const uploadTask = await this.storage
      .ref('avatars')
      .child(this.auth.currentUser?.uid + '')
      .put(img);
    this.currentlySignedInUserAvatarUrl = await uploadTask.ref.getDownloadURL();
  }
  sendMessage(sendThisMessage: any) {
    let messageDTO: MessageDTO = {
      messageContent: sendThisMessage,
      timestamp: new Date(),
      user: 'some user'
    }
    this.firestore
      .collection('myChat')
      .add(messageDTO)

  }

  getMessages() {
    this.firestore
      .collection('myChat')
      .where('user', '==', 'some user')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type == "added") {
            this.messages.push({id: change.doc.id, data: change.doc.data()});
          }
          if (change.type == 'modified') {
            const index = this.messages.findIndex(document => document.id == change.doc.id);
            this.messages[index] =
              {id: change.doc.id, data: change.doc.data()}
          }
          if (change.type == "removed") {
            this.messages = this.messages.filter(m => m.id != change.doc.id);
          }
        })
      })
  }

  register(email: string, password: string) : void {
    this.auth.createUserWithEmailAndPassword(email, password);
  }

  signIn(email: string, password: string): void{
    this.auth.signInWithEmailAndPassword(email, password);
  }
  signOut(): void{
    this.auth.signOut();
  }
}
export interface MessageDTO {
  messageContent: string;
  timestamp: Date;
  user: string;
}
