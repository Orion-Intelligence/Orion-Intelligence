import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgIf, TitleCasePipe } from '@angular/common';
import { GraphListingsComponent } from "../listings/graph-listings.component";
import { loadRuleSetFromStorage, RuleSet, saveRuleSetToStorage } from '../../../shared/model/graph/ruleset_model';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';

@Component({
  selector: 'app-graph-info',
  imports: [TitleCasePipe, NgIf, GraphListingsComponent, TooltipDirective],
  templateUrl: './graph-info.component.html'
})
export class GraphInfoComponent implements OnInit {
  @Input() selectedType!: string;
  @Input() singleInput!: string;
  @Input() propertyType!: string;
  @Input() propertyValue!: string;
  @Input() physicsEnabled!: boolean;
  @Input() expandEnabled!: boolean;
  @Input() expandEnabledTemp!: boolean;
  @Input() result: any[] = []

  @Input() ruleSet!: RuleSet;
  @Output() ruleSetChange = new EventEmitter<RuleSet>();
  @Output() physicsToggled = new EventEmitter<boolean>();
  @Output() expandToggled = new EventEmitter<boolean>();
  @Output() onResetAll = new EventEmitter<void>();

  detailsOpen = true;
  indicatorsOpen = false;
  rulesetOpen = false;

  ngOnInit(): void {
    const loadedRuleSet = loadRuleSetFromStorage();
    this.ruleSet = loadedRuleSet;
    this.ruleSetChange.emit(loadedRuleSet);
  }

  toggleCollapse(section: 'details' | 'indicators' | 'ruleset') {
    if (section === 'details') this.detailsOpen = !this.detailsOpen;
    else if (section === 'indicators') this.indicatorsOpen = !this.indicatorsOpen;
    else if (section === 'ruleset') this.rulesetOpen = !this.rulesetOpen;
  }

  toggleAnimation() {
    this.physicsEnabled = !this.physicsEnabled;
    this.physicsToggled.emit(this.physicsEnabled);
  }

  toggleExpand() {
    this.expandEnabled = !this.expandEnabled;
    this.expandToggled.emit(this.expandEnabled);
  }

  formatPropertyName(input: string): string {
    return input.replace(/^m_/, '').replace(/_/g, ' ').trim();
  }

  onRuleToggle(field: keyof RuleSet, trigger: boolean) {
    this.ruleSet = {
      ...this.ruleSet,
      [field]: !this.ruleSet[field]
    };
    saveRuleSetToStorage(this.ruleSet);
    if (trigger) {
      this.ruleSetChange.emit(this.ruleSet);
    }
    if (field == "edgeColor") {
      this.onResetAll.emit()
    }
  }
}
