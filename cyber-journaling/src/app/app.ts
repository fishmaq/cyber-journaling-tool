import {Component, inject, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('cyber-journaling');
  private httpClient = inject(HttpClient);

  callServer() {
    this.httpClient.get("http://localhost:3001/configData").subscribe(value => console.log(value));
  }
}
