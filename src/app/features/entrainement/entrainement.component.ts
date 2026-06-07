import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ProgramComponent } from './program/program.component';
import { WorkoutComponent } from './workout/workout.component';

@Component({
  selector: 'app-entrainement',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, TabsModule, ProgramComponent, WorkoutComponent],
  templateUrl: './entrainement.component.html',
  styleUrl: './entrainement.component.scss'
})
export default class EntrainementComponent implements OnInit {

  tabs: any[] = [
    { label: "Programmes", value:"0", icon:"calendar_today"},
    { label: "Workouts", value:"1", icon:"fitness_center"}
  ];

  ngOnInit(): void {
   console.log('In onInit !');
   
  }

}
