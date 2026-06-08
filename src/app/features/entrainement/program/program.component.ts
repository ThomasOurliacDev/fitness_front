import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { EntrainementService } from '../entrainement.service';

@Component({
  selector: 'app-program',
  imports: [],
  templateUrl: './program.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './program.component.scss',
})
export class ProgramComponent implements OnInit {

  readonly entrainementService = inject(EntrainementService)

  ngOnInit(): void {
     this.entrainementService.getPrograms().subscribe(programs => {
      console.log('Programs:', programs);
    });
  }
}
