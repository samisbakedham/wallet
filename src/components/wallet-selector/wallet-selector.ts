import { Component } from '@angular/core';
import * as _ from 'lodash';
import { ActionSheetParent } from '../action-sheet/action-sheet-parent';

// Providers
import { CoinbaseProvider } from '../../providers/coinbase/coinbase';
import { CurrencyProvider } from '../../providers/currency/currency';
import { RateProvider } from '../../providers/rate/rate';
@Component({
  selector: 'wallet-selector',
  templateUrl: 'wallet-selector.html'
})
export class WalletSelectorComponent extends ActionSheetParent {
  public walletsByKeys: any[];
  public title: string;
  public selectedWalletId: string;

  public coinbaseData;
  public coinbaseAccounts;
  public showCoinbase;
  public minFiatCurrency;

  constructor(
    public coinbaseProvider: CoinbaseProvider,
    private rateProvider: RateProvider,
    private currencyProvider: CurrencyProvider
  ) {
    super();
  }

  ngOnInit() {
    this.title = this.params.title;
    this.selectedWalletId = this.params.selectedWalletId;
    this.showCoinbase = this.params.showCoinbase;
    this.minFiatCurrency = this.params.minFiatCurrency;
    if (this.showCoinbase) this.setCoinbase();
    this.separateWallets();
  }

  private separateWallets(): void {
    const wallets = this.params.wallets;
    this.walletsByKeys = _.values(_.groupBy(wallets, 'keyId'));
  }

  public optionClicked(option, isCoinbase?: boolean): void {
    if (!isCoinbase) this.dismiss(option);
    else {
      let coinbaseData = _.cloneDeep(this.coinbaseData);
      coinbaseData.accounts = _.find(
        coinbaseData.accounts,
        ac => ac.id == option
      );
      this.dismiss(coinbaseData);
    }
  }

  public getNativeBalance(amount, currency): string {
    return this.coinbaseProvider.getNativeCurrencyBalance(amount, currency);
  }

  private setCoinbase() {
    if (this.coinbaseProvider.isLinked()) {
      this.coinbaseProvider.updateExchangeRates(this.minFiatCurrency.currency);
      this.coinbaseData = this.coinbaseProvider.coinbaseData;
      this.coinbaseAccounts = this.getAvailableAccounts();
    }
  }

  private getAvailableAccounts() {
    let coinbaseAccounts = _.cloneDeep(this.coinbaseData.accounts);
    coinbaseAccounts = coinbaseAccounts.filter(ac => {
      const coin = ac.balance.currency.toLowerCase();
      const availableBalanceFiat = this.rateProvider.toFiat(
        this.currencyProvider.getPrecision(coin).unitToSatoshi *
          Number(ac.balance.amount),
        this.minFiatCurrency.currency,
        coin
      );
      return availableBalanceFiat >= Number(this.minFiatCurrency.amount);
    });
    return coinbaseAccounts;
  }
}
